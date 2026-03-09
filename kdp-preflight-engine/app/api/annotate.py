"""POST /annotate/{job_id}, GET /annotate/{job_id}/status, GET /file/{job_id}/annotated."""
from __future__ import annotations

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from app.job_store import get_annotated_path, get_annotated_status, get_report
from app.tasks.annotate_pdf import annotate_pdf

router = APIRouter()

UUID_PATTERN = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


@router.post("/annotate/{job_id}")
async def trigger_annotate(job_id: str) -> dict:
    """Queue annotated PDF generation. 404 if scan report missing, 202 if queued."""
    if not UUID_PATTERN.match(job_id):
        raise HTTPException(400, "Invalid job ID.")
    if get_report(job_id) is None:
        raise HTTPException(404, "Scan report not found. Run scan first.")
    if get_annotated_status(job_id) == "ready":
        return {"job_id": job_id, "status": "ready"}
    annotate_pdf.delay(job_id)
    return JSONResponse(status_code=202, content={"job_id": job_id, "status": "queued"})


@router.get("/annotate/{job_id}/status")
async def annotate_status(job_id: str) -> dict:
    """Return annotated job status: ready | error | processing."""
    status = get_annotated_status(job_id)
    if status == "ready":
        return {"job_id": job_id, "status": "ready"}
    if status == "error":
        return {"job_id": job_id, "status": "error"}
    return {"job_id": job_id, "status": "processing"}


@router.get("/file/{job_id}/annotated")
async def get_annotated_file(job_id: str) -> FileResponse | JSONResponse:
    """Stream annotated PDF if ready; 202 if still processing, 404 if missing."""
    if get_annotated_status(job_id) != "ready":
        return JSONResponse(status_code=202, content={"status": "processing"})
    path_str = get_annotated_path(job_id)
    if not path_str:
        raise HTTPException(404, "Annotated file not found.")
    path = Path(path_str)
    if not path.exists():
        raise HTTPException(404, "Annotated file not found.")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"{job_id}_annotated.pdf",
    )
