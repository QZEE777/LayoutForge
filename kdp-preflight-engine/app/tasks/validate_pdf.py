"""
Celery task: run full validation pipeline for a job (parse → analyze → rules → report).
"""
from __future__ import annotations

from pathlib import Path

import structlog
from celery import Celery

from app.config import settings
from app.core.document_analyzer import analyze_document
from app.core.kdp_rules_engine import run_validation
from app.core.validation_report import build_report
from app.job_store import get_report, set_report, set_status
from app.schemas import ValidationReport

logger = structlog.get_logger(__name__)

celery_app = Celery(
    "kdp_preflight",
    broker=settings.broker_url,
    backend=settings.result_backend,
)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]


@celery_app.task(bind=True, name="validate_pdf")
def validate_pdf_task(self, job_id: str, file_path: str) -> dict:
    """
    Run validation pipeline. file_path is local path to PDF.
    Sets status and report in Redis.
    """
    set_status(job_id, "processing", "Validation in progress")
    logger.info("validation_started", job_id=job_id)

    try:
        path = Path(file_path)
        if not path.exists():
            set_status(job_id, "failed", "File not found")
            return {"status": "failed", "error": "File not found"}

        doc = analyze_document(path)
        page_count = doc["analysis"]["page_count"]
        errors, warnings, rules_checked = run_validation(doc)
        report = build_report(page_count, errors, warnings, rules_checked)
        set_report(job_id, report)
        set_status(job_id, "completed", None)
        logger.info("validation_completed", job_id=job_id, status=report.status, errors=len(errors), warnings=len(warnings))
        return {"status": "completed", "report_status": report.status}
    except Exception as e:
        logger.exception("validation_failed", job_id=job_id, error=str(e))
        set_status(job_id, "failed", str(e))
        return {"status": "failed", "error": str(e)}
