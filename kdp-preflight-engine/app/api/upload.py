"""POST /upload: accept PDF, store, trigger validation, return job_id."""
from __future__ import annotations

from pathlib import Path

import structlog
from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.config import settings
from app.limiter import limiter
from app.job_store import set_status
from app.schemas import UploadResponse
from app.security import security_checks, validate_file_size, validate_mime
from app.storage import generate_job_id, store_upload_local
from app.tasks.validate_pdf import validate_pdf_task

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("5/minute")
async def upload_pdf(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    content_type = file.content_type
    if not validate_mime(content_type):
        raise HTTPException(400, "Invalid file type. Only application/pdf is accepted.")
    raw = await file.read()
    if not validate_file_size(len(raw)):
        raise HTTPException(400, f"File size exceeds maximum of {settings.max_upload_bytes // (1024*1024)} MB.")
    job_id = generate_job_id()
    path = store_upload_local(raw, job_id)
    try:
        security_checks(path, content_type=content_type, file_size=len(raw))
    except ValueError as e:
        path.unlink(missing_ok=True)
        raise HTTPException(400, str(e))

    # For manu2print usage, run validation inline for all accepted files (up to
    # settings.max_upload_bytes). This removes the dependency on a separate
    # Celery worker for Print Ready Check.
    set_status(job_id, "pending", "Job running inline")
    logger.info("upload_received_inline", job_id=job_id, size=len(raw))
    try:
        logger.info("inline_validation_start", job_id=job_id, size=len(raw))
        validate_pdf_task.apply(args=(job_id, str(path)), throw=False)
        logger.info("inline_validation_done", job_id=job_id)
    except Exception as e:
        logger.exception("inline_validation_failed", job_id=job_id, error=str(e))

    return UploadResponse(job_id=job_id)
