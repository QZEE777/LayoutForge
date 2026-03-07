"""GET /status/{job_id}: return job status."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.job_store import get_report, get_status
from app.schemas import JobStatus, ValidationReport

router = APIRouter()


@router.get("/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str) -> JobStatus:
    status, message = get_status(job_id)
    if status == "pending" and not message:
        message = "Job is queued."
    report = None
    if status == "completed":
        raw = get_report(job_id)
        if raw:
            report = ValidationReport.model_validate(raw)
    if status == "pending" and not get_status(job_id)[0]:
        # Redis might be empty for brand-new job
        pass
    return JobStatus(job_id=job_id, status=status, message=message, report=report)
