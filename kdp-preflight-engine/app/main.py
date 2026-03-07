"""
FastAPI application: KDP Preflight Engine API.
"""
from __future__ import annotations

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import report, status, upload
from app.config import settings

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


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
