# Redis connection — ssl_cert_reqs=None required for Upstash compatibility
"""Job status and report storage (Redis)."""
from __future__ import annotations

import json
import ssl
from typing import Any

import redis

from app.config import settings
from app.schemas import ValidationReport

REDIS_PREFIX = "kdp_preflight"
STATUS_TTL = 86400 * 7  # 7 days
REPORT_TTL = 86400 * 7
ANNOTATED_TTL = 259200  # 72 hours
ANNOTATED_TTL = 259200  # 72 hours


def _client() -> redis.Redis:
    url = settings.redis_url
    # redis-py needs ssl_cert_reqs as the ssl constant for rediss:// (e.g. Upstash)
    if url.strip().lower().startswith("rediss://"):
        return redis.from_url(
            url,
            decode_responses=True,
            ssl_cert_reqs=None,
        )
    return redis.from_url(url, decode_responses=True)


def redis_ping() -> bool:
    """Return True if Redis is reachable, False otherwise. For health/ready checks."""
    try:
        r = _client()
        r.ping()
        return True
    except Exception:
        return False


def set_status(job_id: str, status: str, message: str | None = None) -> None:
    """Set job status: pending, processing, completed, failed."""
    r = _client()
    key = f"{REDIS_PREFIX}:status:{job_id}"
    val = json.dumps({"status": status, "message": message or ""})
    r.setex(key, STATUS_TTL, val)


def get_status(job_id: str) -> tuple[str, str | None]:
    """Return (status, message) for job."""
    r = _client()
    key = f"{REDIS_PREFIX}:status:{job_id}"
    raw = r.get(key)
    if not raw:
        return "pending", None
    data = json.loads(raw)
    return data.get("status", "pending"), data.get("message")


def set_report(job_id: str, report: ValidationReport) -> None:
    """Store validation report for job."""
    r = _client()
    key = f"{REDIS_PREFIX}:report:{job_id}"
    r.setex(key, REPORT_TTL, report.model_dump_json())


def get_report(job_id: str) -> dict[str, Any] | None:
    """Return report as dict or None."""
    r = _client()
    key = f"{REDIS_PREFIX}:report:{job_id}"
    raw = r.get(key)
    if not raw:
        return None
    return json.loads(raw)


def set_annotated_path(job_id: str, path: str) -> None:
    """Store path to annotated PDF. Key annotated:{job_id}, TTL 72h."""
    r = _client()
    r.setex(f"annotated:{job_id}", ANNOTATED_TTL, path)


def get_annotated_path(job_id: str) -> str | None:
    """Return path to annotated PDF or None."""
    r = _client()
    return r.get(f"annotated:{job_id}")


def set_annotated_status(job_id: str, status: str) -> None:
    """Store annotated job status (ready | error). Key annotated_status:{job_id}, TTL 72h."""
    r = _client()
    r.setex(f"annotated_status:{job_id}", ANNOTATED_TTL, status)


def get_annotated_status(job_id: str) -> str | None:
    """Return annotated status or None."""
    r = _client()
    return r.get(f"annotated_status:{job_id}")
