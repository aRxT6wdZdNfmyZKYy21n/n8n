"""
LDAP/AD client: bind and fetch users that belong to configured groups.
Returns list of dicts with email and resolved n8n role per user.
"""
from __future__ import annotations

import logging
from typing import Any

from ldap3 import ALL, Connection, Server, SUBTREE

from app.config import Settings

logger = logging.getLogger(__name__)


def get_ldap_users_and_roles(settings: Settings) -> list[dict[str, Any]]:
    """
    Connect to LDAP/AD, find users that are members of LDAP_GROUPS,
    map each user to an n8n role via GROUP_ROLE_MAP. Returns list of
    { "email": str, "role": str, "dn": str } (one entry per user; if user
    is in multiple groups, first matching role wins).
    """
    group_list = settings.ldap_group_list
    group_role_map = settings.group_role_map_dict
    if not group_list or not group_role_map:
        logger.warning("LDAP_GROUPS or GROUP_ROLE_MAP empty; skipping LDAP")
        return []

    server = Server(settings.ldap_url, get_info=ALL)
    try:
        conn = Connection(
            server,
            user=settings.ldap_bind_dn,
            password=settings.ldap_bind_password,
            auto_bind=True,
        )
    except Exception as e:
        logger.exception("LDAP connection failed: %s", e)
        return []

    try:
        # Build (group_dn -> n8n_role) for groups we care about
        group_to_role: dict[str, str] = {}
        for g in group_list:
            role = group_role_map.get(g) or group_role_map.get(g.split(",")[0].replace("CN=", ""))
            if role:
                group_to_role[g] = role

        # Search for group members. Approach: search groups by DN/name, then get member list.
        # ldap3: search group, get "member" or "memberOf" (depending on AD vs OpenLDAP).
        # For AD, we often search users with memberOf=<group_dn>.
        user_emails: dict[str, str] = {}  # email -> best role (prefer admin over member)
        role_priority = {"global:owner": 3, "global:admin": 2, "global:member": 1}

        for group_dn in group_list:
            role = group_to_role.get(group_dn) or group_role_map.get(
                group_dn.split(",")[0].replace("CN=", "").strip()
            )
            if not role:
                continue
            # Find users that are members of this group (AD: memberOf)
            user_filter = f"(&{settings.ldap_user_filter}(memberOf={group_dn}))"
            conn.search(
                settings.ldap_base_dn,
                user_filter,
                SUBTREE,
                attributes=["mail", "userPrincipalName", "sAMAccountName"],
            )
            for entry in conn.entries:
                for attr in ("mail", "userPrincipalName"):
                    val = getattr(entry, attr, None)
                    if val is None:
                        continue
                    if hasattr(val, "value"):
                        val = val.value
                    if isinstance(val, list):
                        val = val[0] if val else ""
                    email = str(val or "").strip().lower()
                    if email and "@" in email:
                        break
                else:
                    continue
                existing_role = user_emails.get(email)
                if existing_role is None or role_priority.get(role, 0) > role_priority.get(existing_role, 0):
                    user_emails[email] = role

        return [{"email": email, "role": role} for email, role in user_emails.items()]
    finally:
        conn.unbind()
