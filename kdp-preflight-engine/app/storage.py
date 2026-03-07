"""
Storage: save uploads to local disk or S3/R2. Returns path (local) or key (S3) for job.
"""
from __future__ import annotations

import uuid
from pathlib import Path

from app.config import settings


def generate_job_id() -> str:
    return str(uuid.uuid4())


def store_upload_local(content: bytes, job_id: str) -> Path:
    """Store uploaded PDF to local directory. Returns absolute path to file (for worker)."""
    base = Path(settings.local_upload_dir).resolve()
    base.mkdir(parents=True, exist_ok=True)
    path = base / f"{job_id}.pdf"
    path.write_bytes(content)
    return path.resolve()


def get_local_path(job_id: str) -> Path | None:
    """Return path to stored PDF for job_id if it exists."""
    path = Path(settings.local_upload_dir) / f"{job_id}.pdf"
    return path if path.exists() else None


def delete_local(job_id: str) -> None:
    """Remove stored file for job_id (optional cleanup)."""
    path = Path(settings.local_upload_dir) / f"{job_id}.pdf"
    if path.exists():
        path.unlink(missing_ok=True)
