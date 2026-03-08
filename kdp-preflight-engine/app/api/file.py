"""GET /file/{job_id}: stream the stored PDF for a job. Used by frontend viewer for large-file preview."""
from __future__ import annotations

import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.storage import get_local_path

router = APIRouter()

# Job IDs are UUIDs from generate_job_id(); reject anything else to avoid path traversal.
UUID_PATTERN = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


@router.get("/file/{job_id}")
async def get_job_file(job_id: str) -> FileResponse:
    """Return the stored PDF for this job. 404 if not found."""
    if not UUID_PATTERN.match(job_id):
        raise HTTPException(400, "Invalid job ID.")
    path = get_local_path(job_id)
    if not path or not path.exists():
        raise HTTPException(404, "File not found. Job may have expired or failed.")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"{job_id}.pdf",
        headers={"Cache-Control": "private, max-age=3600"},
    )
