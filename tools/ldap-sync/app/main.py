from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

import jwt
from fastapi import FastAPI
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus

from app.config import Settings
from app.ldap_client import authenticate_ldap_user
from app.sync import run_sync

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = Settings()
sync_task: asyncio.Task[Any] | None = None


async def sync_loop() -> None:
    while True:
        try:
            result = await asyncio.to_thread(run_sync, settings)
            logger.info(
                "Sync cycle: created=%s blocked=%s unblocked=%s",
                result.get("created", 0),
                result.get("blocked", 0),
                result.get("unblocked", 0),
            )
        except Exception as e:
            logger.exception("Sync loop error: %s", e)
        await asyncio.sleep(settings.sync_interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sync_task
    sync_task = asyncio.create_task(sync_loop())
    yield
    if sync_task:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="ldap-sync", lifespan=lifespan)


class LoginRequest(BaseModel):
    login: str
    password: str
    redirect: str | None = "/"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/sync")
def trigger_sync() -> dict[str, str]:
    """Run one sync cycle immediately (in background)."""
    async def _run() -> None:
        result = await asyncio.to_thread(run_sync, settings)
        logger.info(
            "Manual sync: created=%s blocked=%s unblocked=%s",
            result.get("created", 0),
            result.get("blocked", 0),
            result.get("unblocked", 0),
        )

    asyncio.create_task(_run())
    return {"status": "sync triggered"}


@app.post("/auth/login")
def auth_login(payload: LoginRequest) -> dict[str, str]:
    if not settings.trusted_auth_secret:
        return {"status": "error", "message": "trusted_auth_secret is not configured"}

    user = authenticate_ldap_user(settings, payload.login, payload.password)
    if not user:
        return {"status": "error", "message": "Invalid credentials"}

    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=settings.trusted_auth_token_ttl_seconds)
    token_payload = {
        "sub": user["email"],
        "email": user["email"],
        "firstName": user.get("firstName"),
        "lastName": user.get("lastName"),
        "groups": user.get("groups", []),
        "jti": str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(token_payload, settings.trusted_auth_secret, algorithm="HS256")

    base = settings.n8n_base_url.rstrip("/")
    path = settings.n8n_trusted_login_path
    redirect = payload.redirect or "/"
    url = f"{base}{path}?token={quote_plus(token)}&redirect={quote_plus(redirect)}"
    return {"status": "ok", "redirectUrl": url}
