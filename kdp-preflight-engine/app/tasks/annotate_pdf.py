"""
Inline annotation: generate annotated PDF with severity-coded rectangles, upload to R2.
No Celery, no Redis — runs synchronously and returns the R2 key.
"""
from __future__ import annotations

import io
from pathlib import Path
from typing import Any

import boto3
import fitz
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

# Severity → RGB color (values 0.0–1.0 for PyMuPDF)
_SEVERITY_COLORS: dict[str, tuple[float, float, float]] = {
    "critical": (1.0, 0.0, 0.0),
    "error":    (1.0, 0.0, 0.0),
    "advanced": (1.0, 0.0, 0.0),
    "moderate": (1.0, 0.6, 0.0),
    "warning":  (1.0, 0.6, 0.0),
    "easy":     (1.0, 0.6, 0.0),
    "minor":    (1.0, 0.6, 0.0),
}
# fixDifficulty (from TypeScript enrichment) → RGB color — takes priority over severity
_FIX_DIFFICULTY_COLORS: dict[str, tuple[float, float, float]] = {
    "advanced": (1.0, 0.0, 0.0),
    "moderate": (1.0, 0.6, 0.0),
    "easy":     (1.0, 0.6, 0.0),
}
_DEFAULT_COLOR: tuple[float, float, float] = (1.0, 0.6, 0.0)  # orange fallback


def _color_for_severity(severity: str | None) -> tuple[float, float, float]:
    if not severity:
        return _DEFAULT_COLOR
    return _SEVERITY_COLORS.get(severity.lower().strip(), _DEFAULT_COLOR)


def _color_for_issue(issue: dict[str, Any]) -> tuple[float, float, float]:
    """Prefer fixDifficulty (TS-enriched) over raw severity for color selection."""
    fix_diff = str(issue.get("fixDifficulty") or "").lower().strip()
    if fix_diff in _FIX_DIFFICULTY_COLORS:
        return _FIX_DIFFICULTY_COLORS[fix_diff]
    return _color_for_severity(issue.get("severity"))


def annotate_pdf_inline(report: dict[str, Any], path_in: Path) -> str:
    """
    Draw severity-coded bounding-box rectangles on every page_issue that has a bbox.
    Save the annotated PDF to an in-memory buffer, upload to R2 via boto3,
    and return the R2 key.

    Args:
        report: dict with a 'page_issues' list (same shape as the preflight engine report).
        path_in: Path to the original PDF on local disk.

    Returns:
        R2 key of the uploaded annotated PDF, e.g. 'annotated/<job_id>_annotated.pdf'.
    """
    job_id = path_in.stem  # e.g. "abc-uuid-123" from "abc-uuid-123.pdf"

    buf = io.BytesIO()
    doc = fitz.open(str(path_in))
    try:
        for issue in report.get("page_issues", []):
            page_index = issue.get("page", 1) - 1
            if page_index < 0 or page_index >= len(doc):
                continue
            bbox = issue.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x, y, w, h = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
            color = _color_for_issue(issue)
            page = doc[page_index]
            rect = fitz.Rect(x, y, x + w, y + h)
            page.draw_rect(rect, color=color, fill=None, width=2.0)
            label = issue.get("message") or issue.get("type") or issue.get("severity") or "Issue"
            label = label[:60]  # truncate if too long
            page.insert_text(
                fitz.Point(x, max(y - 4, 8)),
                label,
                fontsize=6,
                color=color,
            )
        doc.save(buf)
    finally:
        doc.close()

    buf.seek(0)
    r2_key = f"annotated/{job_id}_annotated.pdf"

    s3 = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=settings.s3_region,
    )
    s3.put_object(
        Bucket=settings.s3_bucket,
        Key=r2_key,
        Body=buf.getvalue(),
        ContentType="application/pdf",
    )

    logger.info("annotate_pdf_inline_done", job_id=job_id, r2_key=r2_key)
    return r2_key
