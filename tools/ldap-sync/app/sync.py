"""
Sync logic: diff LDAP users vs n8n users; create missing, set ldapBlocked for those who lost group.
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import Settings
from app.ldap_client import get_ldap_users_and_roles
from app.n8n_client import N8nClient

logger = logging.getLogger(__name__)


def run_sync(settings: Settings) -> dict[str, int]:
    """
    Run one sync cycle. Returns counts: created, blocked, unblocked.
    """
    n8n = N8nClient(settings)
    if not n8n.login():
        logger.error("Cannot login to n8n; aborting sync")
        return {"created": 0, "blocked": 0, "unblocked": 0}

    try:
        ldap_users = get_ldap_users_and_roles(settings)
    except Exception as e:
        logger.exception("LDAP fetch failed: %s", e)
        return {"created": 0, "blocked": 0, "unblocked": 0}

    ldap_emails = {u["email"] for u in ldap_users}
    ldap_by_email = {u["email"]: u["role"] for u in ldap_users}

    try:
        n8n_users = n8n.list_users()
    except Exception as e:
        logger.exception("n8n list users failed: %s", e)
        return {"created": 0, "blocked": 0, "unblocked": 0}

    n8n_by_email: dict[str, dict[str, Any]] = {}
    for u in n8n_users:
        email = (u.get("email") or "").strip().lower()
        if email:
            n8n_by_email[email] = u

    created = 0
    blocked = 0
    unblocked = 0

    # Create users that are in LDAP but not in n8n
    invitations: list[dict[str, str]] = [
        {"email": u["email"], "role": u["role"]} for u in ldap_users if u["email"] not in n8n_by_email
    ]
    # Send invitations in batches to reduce request count
    batch_size = 20
    for i in range(0, len(invitations), batch_size):
        batch = invitations[i : i + batch_size]
        try:
            n8n.create_users(batch)
            created += len(batch)
            logger.info("Created %s users (batch)", len(batch))
        except Exception as e:
            # Fall back to individual creates to isolate failures
            logger.warning("Failed to create batch of %s users: %s", len(batch), e)
            for inv in batch:
                try:
                    n8n.create_users([inv])
                    created += 1
                    logger.info("Created user %s with role %s", inv["email"], inv["role"])
                except Exception as e2:
                    logger.warning("Failed to create %s: %s", inv["email"], e2)

    # For each n8n user: if not in LDAP allowed list -> set ldapBlocked true; else set false
    # Never block global owner (they must always be able to log in)
    for email, n8n_user in n8n_by_email.items():
        user_id = n8n_user.get("id")
        if not user_id:
            continue
        if n8n_user.get("role") == "global:owner":
            continue
        in_ldap = email in ldap_emails
        current_blocked = (n8n_user.get("settings") or {}).get("ldapBlocked") is True

        if not in_ldap and not current_blocked:
            try:
                n8n.set_user_settings(user_id, {"ldapBlocked": True})
                blocked += 1
                logger.info("Blocked user %s (no longer in AD groups)", email)
            except Exception as e:
                logger.warning("Failed to block %s: %s", email, e)
        elif in_ldap and current_blocked:
            try:
                n8n.set_user_settings(user_id, {"ldapBlocked": False})
                unblocked += 1
                logger.info("Unblocked user %s", email)
            except Exception as e:
                logger.warning("Failed to unblock %s: %s", email, e)

    return {"created": created, "blocked": blocked, "unblocked": unblocked}
