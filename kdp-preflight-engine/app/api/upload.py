"""POST /upload: accept PDF, store, trigger validation, return job_id."""
from __future__ import annotations

from pathlib import Path

import structlog
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.job_store import set_status
from app.schemas import UploadResponse
from app.security import security_checks, validate_file_size, validate_mime
from app.storage import generate_job_id, store_upload_local
from app.tasks.validate_pdf import validate_pdf_task

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)) -> UploadResponse:
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
    set_status(job_id, "pending", "Job queued")
    logger.info("upload_received", job_id=job_id, size=len(raw))
    validate_pdf_task.delay(job_id, str(path))
    return UploadResponse(job_id=job_id)
