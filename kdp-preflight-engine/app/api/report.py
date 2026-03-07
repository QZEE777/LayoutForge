"""GET /report/{job_id}: return validation report JSON."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.job_store import get_report, get_status
from app.schemas import ValidationReport

router = APIRouter()


@router.get("/report/{job_id}", response_model=ValidationReport)
async def get_validation_report(job_id: str) -> ValidationReport:
    status, _ = get_status(job_id)
    if status == "failed":
        raise HTTPException(404, "Validation failed for this job. No report available.")
    if status in ("pending", "processing"):
        raise HTTPException(202, "Validation still in progress. Poll /status/{job_id}.")
    raw = get_report(job_id)
    if not raw:
        raise HTTPException(404, "Report not found. Job may have expired or failed.")
    return ValidationReport.model_validate(raw)
