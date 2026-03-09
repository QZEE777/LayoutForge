"""
Celery task: generate annotated PDF with validation issue rectangles and labels.
"""
from __future__ import annotations

from pathlib import Path

import fitz
import structlog

from app.job_store import get_report, set_annotated_path, set_annotated_status
from app.storage import get_local_path
from app.tasks.validate_pdf import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task(bind=True, name="annotate_pdf")
def annotate_pdf(self, job_id: str) -> None:
    """
    Load report from Redis, open PDF at get_local_path(job_id), draw red rects + labels
    for each page_issue with bbox, save as {job_id}_annotated.pdf, store path and status in Redis.
    """
    try:
        report = get_report(job_id)
        if not report or "page_issues" not in report:
            set_annotated_status(job_id, "error")
            raise ValueError("Report not found or missing page_issues")

        path_in = get_local_path(job_id)
        if not path_in or not path_in.exists():
            set_annotated_status(job_id, "error")
            raise FileNotFoundError(f"Original PDF not found for job {job_id}")

        out_dir = path_in.parent
        annotated_path = out_dir / f"{job_id}_annotated.pdf"

        doc = fitz.open(path_in)
        try:
            for issue in report.get("page_issues", []):
                page_index = issue.get("page", 1) - 1
                if page_index < 0 or page_index >= len(doc):
                    continue
                bbox = issue.get("bbox")
                if not bbox or len(bbox) != 4:
                    continue
                x, y, w, h = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
                page = doc[page_index]
                rect = fitz.Rect(x, y, x + w, y + h)
                page.draw_rect(rect, color=(1, 0, 0), width=1.5)
                label = f"{issue.get('rule_id', '')}: {(issue.get('message') or '')[:60]}"
                page.insert_text(
                    fitz.Point(x, max(y - 2, 10)),
                    label,
                    fontsize=7,
                    color=(1, 0, 0),
                )
            doc.save(str(annotated_path))
        finally:
            doc.close()

        path_str = str(annotated_path.resolve())
        set_annotated_path(job_id, path_str)
        set_annotated_status(job_id, "ready")
        logger.info("annotate_pdf_done", job_id=job_id, path=path_str)
    except Exception:
        set_annotated_status(job_id, "error")
        raise
