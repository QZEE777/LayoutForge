"""
Storage: save uploads to local disk or S3/R2. Returns path (local) or key (S3) for job.
"""
from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

import boto3
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)


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


def get_pdf_path(job_id: str) -> Path | None:
    """Return a Path to the PDF for job_id.

    Checks local disk first (backward-compatible with uploads that are always
    stored locally by store_upload_local).  If the file is not present locally,
    attempts to download it from S3/R2 into a temporary file and returns that
    path instead.  Returns None if the file cannot be found in either location.
    """
    # 1. Fast path: file already on local disk.
    local = get_local_path(job_id)
    if local is not None:
        return local

    # 2. Fallback: try to fetch from S3/R2.
    s3_key = f"{job_id}.pdf"
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
            region_name=settings.s3_region,
        )
        response = s3.get_object(Bucket=settings.s3_bucket, Key=s3_key)
        pdf_bytes = response["Body"].read()
    except Exception as exc:
        logger.warning("get_pdf_path_s3_miss", job_id=job_id, error=str(exc))
        return None

    # Write to a named temp file that persists until the caller is done with it.
    # delete=False so the file survives after close(); the OS will clean it up on
    # process exit, or the caller can unlink it explicitly.
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    try:
        tmp.write(pdf_bytes)
        tmp.flush()
    finally:
        tmp.close()

    logger.info("get_pdf_path_s3_hit", job_id=job_id, tmp_path=tmp.name)
    return Path(tmp.name)


def delete_local(job_id: str) -> None:
    """Remove stored file for job_id (optional cleanup)."""
    path = Path(settings.local_upload_dir) / f"{job_id}.pdf"
    if path.exists():
        path.unlink(missing_ok=True)
