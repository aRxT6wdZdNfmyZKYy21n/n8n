from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI

from app.config import Settings
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
