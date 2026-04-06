from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, ingest, dashboard

app = FastAPI(title="Juno API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://juno.so"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1")
app.include_router(ingest.router, prefix="/v1")
app.include_router(dashboard.router, prefix="/v1")


@app.get("/healthz")
async def health():
    return {"ok": True}
