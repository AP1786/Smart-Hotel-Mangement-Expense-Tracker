from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import router as ledger_router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(
    title="Smart Hotel Python Ledger",
    version="1.0.0",
    description="Off-chain hotel ledger service with blockchain-style block hashing.",
)


@app.get("/health", tags=["health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}


app.include_router(ledger_router, prefix=settings.api_prefix)
