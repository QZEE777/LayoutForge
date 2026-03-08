"""
FastAPI application: KDP Preflight Engine API.
"""
from __future__ import annotations

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import report, status, upload
from app.config import settings
from app.job_store import redis_ping
from app.limiter import limiter

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)

app = FastAPI(
    title=settings.app_name,
    description="Deterministic PDF validation for Amazon KDP paperback requirements",
    version="0.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"error": "Upload rate limit exceeded. Please try again later."},
    ),
)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(upload.router, tags=["upload"])
app.include_router(status.router, tags=["status"])
app.include_router(report.router, tags=["report"])


@app.get("/")
def root():
    """Root: so health probes hitting / get 200. Prefer /health or /health/ready for checks."""
    return {"service": settings.app_name, "docs": "/health", "ready": "/health/ready"}


@app.get("/health")
def health():
    """Liveness: app is up. Use for simple ping."""
    return {"status": "ok", "service": settings.app_name}


@app.get("/health/ready")
def health_ready():
    """Readiness: app + Redis. Returns 503 if Redis unreachable so load balancers don't send traffic."""
    if not redis_ping():
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "service": settings.app_name, "redis": "unreachable"},
        )
    return {"status": "ok", "service": settings.app_name, "redis": "ok"}
