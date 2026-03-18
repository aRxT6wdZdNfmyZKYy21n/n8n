"""
n8n REST API client: login (session cookie), list users, create users via invitations, set ldapBlocked.
"""
from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)


class N8nClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._base = settings.n8n_rest_url
        self._cookies: dict[str, str] = {}
        self._last_request_at = 0.0

    def _url(self, path: str) -> str:
        path = path.lstrip("/")
        return f"{self._base}/{path}"

    def _throttle(self) -> None:
        interval = float(self.settings.n8n_min_request_interval_seconds)
        if interval <= 0:
            return
        now = time.monotonic()
        wait_for = self._last_request_at + interval - now
        if wait_for > 0:
            time.sleep(wait_for)
        self._last_request_at = time.monotonic()

    def login(self) -> bool:
        """Log in as owner; store session cookie for subsequent requests."""
        url = self._url("login")
        payload = {
            "emailOrLdapLoginId": self.settings.n8n_owner_email,
            "password": self.settings.n8n_owner_password,
        }
        try:
            with httpx.Client(timeout=15.0, follow_redirects=True) as client:
                self._throttle()
                r = client.post(url, json=payload)
                r.raise_for_status()
                # n8n sets session cookie in response
                for name, value in r.cookies.items():
                    self._cookies[name] = value
                if not self._cookies:
                    logger.warning("Login succeeded but no session cookie received")
                return True
        except httpx.HTTPStatusError as e:
            logger.error("n8n login failed: %s %s", e.response.status_code, e.response.text)
            return False
        except Exception as e:
            logger.exception("n8n login error: %s", e)
            return False

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Any = None,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        url = self._url(path)
        retries = int(self.settings.n8n_max_retries)
        delay = float(self.settings.n8n_retry_delay_seconds)
        attempt = 0
        while True:
            with httpx.Client(timeout=30.0, follow_redirects=True, cookies=self._cookies) as client:
                self._throttle()
                r = client.request(method, url, json=json, params=params or {})

            if r.status_code != 429:
                return r

            attempt += 1
            if attempt > retries:
                return r
            logger.warning(
                "n8n rate-limited (429). Waiting %.1fs and retrying (attempt %s/%s)",
                delay,
                attempt,
                retries,
            )
            time.sleep(delay)

    def list_users(self) -> list[dict[str, Any]]:
        """GET /users; returns list of users (items with id, email, role, settings, ...)."""
        out: list[dict[str, Any]] = []
        take = 100
        skip = 0
        while True:
            params: dict[str, Any] = {"take": take, "skip": skip}
            r = self._request("GET", "users", params=params)
            if r.status_code == 401:
                if self.login():
                    continue
                r.raise_for_status()
            r.raise_for_status()
            data = r.json()
            items = data.get("items", [])
            out.extend(items)
            if len(items) < take:
                break
            skip += take
        return out

    def create_users(self, invitations: list[dict[str, str]]) -> list[dict[str, Any]]:
        """POST /invitations with body [{ email, role }]. Creates user shells and may send invite emails."""
        if not invitations:
            return []
        r = self._request("POST", "invitations", json=invitations)
        if r.status_code == 401:
            if self.login():
                return self.create_users(invitations)
            r.raise_for_status()
        r.raise_for_status()
        return r.json()

    def set_user_settings(self, user_id: str, settings: dict[str, Any]) -> None:
        """PATCH /users/:id/settings with e.g. { ldapBlocked: true }."""
        r = self._request("PATCH", f"users/{user_id}/settings", json=settings)
        if r.status_code == 401:
            if self.login():
                self.set_user_settings(user_id, settings)
                return
            r.raise_for_status()
        r.raise_for_status()
