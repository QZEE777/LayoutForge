"""POST /annotate/{job_id} — inline (synchronous) annotated PDF generation."""
from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Body, HTTPException

from app.storage import get_pdf_path
from app.tasks.annotate_pdf import annotate_pdf_inline

router = APIRouter()

UUID_PATTERN = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


@router.post("/annotate/{job_id}")
async def trigger_annotate(
    job_id: str,
    body: dict[str, Any] = Body(default=None),
) -> dict:
    """
    Generate annotated PDF inline (synchronous — no Celery, no Redis).
    Caller POSTs JSON. Expected keys (see LayoutForge `buildCheckerAnnotateReportBody`):
    - page_issues (required for overlays)
    - score, total_checks, passed_checks (summary page; score matches site readiness)
    - pass_threshold (optional, default 80; site sends 95)
    - display_filename (optional; else server filename is shown)
    Returns {"job_id", "status": "ready", "r2_key"} on success.
    """
    if not UUID_PATTERN.match(job_id):
        raise HTTPException(400, "Invalid job ID.")

    path_in = get_pdf_path(job_id)
    if not path_in or not path_in.exists():
        raise HTTPException(404, "PDF not found for job. Upload first.")

    report: dict[str, Any] = body or {}
    if "page_issues" not in report:
        report = {"page_issues": []}

    try:
        r2_key = annotate_pdf_inline(report, path_in)
    except Exception as exc:
        raise HTTPException(500, f"Annotation failed: {exc}") from exc

    return {"job_id": job_id, "status": "ready", "r2_key": r2_key}
