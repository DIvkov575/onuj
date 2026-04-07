from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger("juno")

from app.config import settings
from app.routers import auth, ingest, dashboard
from app.routers import api_keys, workspace

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Fail fast: verify DB is reachable and migrations are applied before accepting traffic."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text
    try:
        engine = create_async_engine(settings.database_url, pool_size=1)
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            # Confirm our core tables exist (catches un-migrated DB)
            await conn.execute(text("SELECT 1 FROM workspaces LIMIT 1"))
        await engine.dispose()
        logger.info("DB connectivity check passed")
    except Exception as e:
        logger.error(f"Startup failed — DB unreachable or migrations not applied: {e}")
        raise SystemExit(1)
    yield


app = FastAPI(title="Juno API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/v1")
app.include_router(ingest.router,    prefix="/v1")
app.include_router(dashboard.router, prefix="/v1")
app.include_router(api_keys.router,  prefix="/v1")
app.include_router(workspace.router, prefix="/v1")


@app.get("/healthz")
async def health():
    return {"ok": True}
