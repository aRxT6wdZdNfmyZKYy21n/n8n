from __future__ import annotations

import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # n8n
    n8n_base_url: str = "http://localhost:5678"
    n8n_rest_prefix: str = "/rest"
    n8n_owner_email: str = ""
    n8n_owner_password: str = ""

    # LDAP
    ldap_url: str = "ldap://localhost:389"
    ldap_bind_dn: str = ""
    ldap_bind_password: str = ""
    ldap_base_dn: str = ""
    # Use semicolon-separated values since AD group DNs contain commas.
    # Example: "CN=n8n_users,OU=Groups,DC=company,DC=com;CN=n8n_admins,OU=Groups,DC=company,DC=com"
    ldap_groups: str = ""
    ldap_user_filter: str = "(objectClass=user)"

    # group DN or name -> n8n role slug
    group_role_map: str = "{}"  # JSON object

    sync_interval_seconds: int = 300

    @field_validator("group_role_map", mode="before")
    @classmethod
    def parse_group_role_map(cls, v: Any) -> str:
        if isinstance(v, dict):
            return json.dumps(v)
        return str(v)

    @property
    def group_role_map_dict(self) -> dict[str, str]:
        return json.loads(self.group_role_map) if self.group_role_map.strip() else {}

    @property
    def ldap_group_list(self) -> list[str]:
        raw = self.ldap_groups.strip()
        if not raw:
            return []
        # Use ';' as delimiter (safe for DNs which contain commas).
        return [g.strip() for g in raw.split(";") if g.strip()]

    @property
    def n8n_rest_url(self) -> str:
        base = self.n8n_base_url.rstrip("/")
        prefix = self.n8n_rest_prefix.strip("/")
        return f"{base}/{prefix}" if prefix else base
