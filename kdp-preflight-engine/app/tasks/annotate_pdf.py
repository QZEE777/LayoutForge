"""
Inline annotation: generate annotated PDF with severity-coded rectangles, upload to R2.
No Celery, no Redis — runs synchronously and returns the R2 key.
"""
from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Any

import boto3
import fitz
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

_CRITICAL_COLOR: tuple[float, float, float] = (1.0, 0.0, 0.0)
_WARNING_COLOR: tuple[float, float, float] = (1.0, 0.55, 0.0)
_PASS_COLOR: tuple[float, float, float] = (0.2, 0.7, 0.2)  # summary page only
_BRAND_ORANGE: tuple[float, float, float] = (1.0, 0.35, 0.16)
_GREY_TEXT: tuple[float, float, float] = (0.4, 0.4, 0.4)
_A4_WIDTH = 595
_A4_HEIGHT = 842
_MAX_LABEL_LEN = 60


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    if max_len <= 1:
        return "…"
    return f"{text[: max_len - 1]}…"


def _normalize_severity(issue: dict[str, Any]) -> str:
    severity = str(issue.get("severity") or "").lower().strip()
    issue_type = str(issue.get("type") or issue.get("rule_id") or "").lower().strip()

    if severity in {"critical", "error", "advanced"}:
        return "critical"
    if any(token in issue_type for token in ("margin", "bleed", "trim", "page_size", "page-size")):
        return "critical"
    return "warning"


def _has_internal_code(text: str) -> bool:
    if "_" in text:
        return True
    return bool(re.search(r"\b[A-Z0-9]{2,}(?:_[A-Z0-9]+)*\b", text))


def _to_float_str(value: Any, suffix: str = "") -> str:
    if value is None:
        return "?"
    try:
        v = float(value)
        return f"{v:g}{suffix}"
    except Exception:
        return f"{value}{suffix}"


def _make_label(issue: dict[str, Any]) -> str:
    message = str(issue.get("message") or "").strip()
    if message and not _has_internal_code(message):
        return _truncate(message, _MAX_LABEL_LEN)

    issue_type_raw = str(issue.get("type") or issue.get("rule_id") or "Issue")
    issue_type = issue_type_raw.lower().strip()
    found = issue.get("found")
    required = issue.get("required")
    font_name = issue.get("fontName") or issue.get("font_name") or issue.get("font")

    if issue_type in {"margin_left", "margin-left"}:
        label = f"LEFT MARGIN: {_to_float_str(found, 'in')} — min {_to_float_str(required, 'in')} required"
    elif issue_type in {"margin_right", "margin-right"}:
        label = f"RIGHT MARGIN: {_to_float_str(found, 'in')} — min {_to_float_str(required, 'in')} required"
    elif issue_type in {"margin_top", "margin-top"}:
        label = f"TOP MARGIN: {_to_float_str(found, 'in')} — min {_to_float_str(required, 'in')} required"
    elif issue_type in {"margin_bottom", "margin-bottom"}:
        label = f"BOTTOM MARGIN: {_to_float_str(found, 'in')} — min {_to_float_str(required, 'in')} required"
    elif issue_type in {"page_size", "page-size"}:
        label = f"PAGE SIZE: {found if found is not None else '?'} — expected {required if required is not None else '?'}"
    elif issue_type in {"font_embedded", "font-embedded"}:
        label = f"FONT NOT EMBEDDED: {font_name if font_name else 'Unknown font'}"
    elif issue_type == "bleed":
        label = f"BLEED: {_to_float_str(found, 'in')} — min {_to_float_str(required, 'in')} required"
    else:
        label = issue_type_raw.replace("_", " ").replace("-", " ").title()
    return _truncate(label, _MAX_LABEL_LEN)


def _color_for_normalized(normalized: str) -> tuple[float, float, float]:
    return _CRITICAL_COLOR if normalized == "critical" else _WARNING_COLOR


def _draw_summary_page(doc: fitz.Document, report: dict[str, Any], filename: str) -> None:
    page = doc.new_page(pno=0, width=_A4_WIDTH, height=_A4_HEIGHT)

    display_name = str(report.get("display_filename") or "").strip() or filename

    page.insert_text(
        fitz.Point(24, 36),
        "manu2print",
        fontsize=18,
        fontname="helvB",
        color=_BRAND_ORANGE,
    )
    page.insert_text(
        fitz.Point(_A4_WIDTH - 250, 36),
        _truncate(display_name, 40),
        fontsize=8,
        fontname="helv",
        color=_GREY_TEXT,
    )

    page_issues = report.get("page_issues")
    issues: list[dict[str, Any]] = page_issues if isinstance(page_issues, list) else []
    critical_issues = [i for i in issues if _normalize_severity(i) == "critical"]
    warning_issues = [i for i in issues if _normalize_severity(i) == "warning"]
    issue_count = len(issues)

    score_raw = report.get("score", 0)
    try:
        score = max(0, min(100, int(float(score_raw))))
    except Exception:
        score = 0

    pass_thr_raw = report.get("pass_threshold", 80)
    try:
        pass_threshold = int(float(pass_thr_raw))
    except Exception:
        pass_threshold = 80
    if pass_threshold < 50 or pass_threshold > 99:
        pass_threshold = 80

    score_color = (
        _CRITICAL_COLOR if score < 50 else _WARNING_COLOR if score < pass_threshold else _PASS_COLOR
    )

    center = fitz.Point(297, 200)
    radius = 45
    page.draw_circle(center, radius, color=score_color, fill=score_color, width=1.5)

    score_rect = fitz.Rect(center.x - radius, center.y - 24, center.x + radius, center.y + 14)
    page.insert_textbox(
        score_rect,
        str(score),
        fontsize=32,
        fontname="helvB",
        color=(1.0, 1.0, 1.0),
        align=1,
    )
    score_suffix_rect = fitz.Rect(center.x - radius, center.y + 10, center.x + radius, center.y + 30)
    page.insert_textbox(
        score_suffix_rect,
        "/100",
        fontsize=12,
        fontname="helv",
        color=(1.0, 1.0, 1.0),
        align=1,
    )

    is_pass = score >= pass_threshold
    page.insert_textbox(
        fitz.Rect(0, 270, _A4_WIDTH, 295),
        "PASS" if is_pass else "FAIL",
        fontsize=20,
        fontname="helvB",
        color=_PASS_COLOR if is_pass else _CRITICAL_COLOR,
        align=1,
    )

    total_checks_raw = report.get("total_checks")
    try:
        total_checks = int(total_checks_raw) if total_checks_raw is not None else issue_count
    except Exception:
        total_checks = issue_count
    passed_checks_raw = report.get("passed_checks")
    try:
        passed_checks = int(passed_checks_raw) if passed_checks_raw is not None else max(total_checks - issue_count, 0)
    except Exception:
        passed_checks = max(total_checks - issue_count, 0)

    block_centers = [149, 297, 446]
    stats = [
        ("Critical Issues", len(critical_issues), _CRITICAL_COLOR),
        ("Warnings", len(warning_issues), _WARNING_COLOR),
        ("Passed Checks", passed_checks, _PASS_COLOR),
    ]
    for (label, value, color), x_center in zip(stats, block_centers):
        page.insert_textbox(
            fitz.Rect(x_center - 60, 320, x_center + 60, 350),
            str(value),
            fontsize=24,
            fontname="helvB",
            color=color,
            align=1,
        )
        page.insert_textbox(
            fitz.Rect(x_center - 70, 350, x_center + 70, 365),
            label,
            fontsize=8,
            fontname="helv",
            color=_GREY_TEXT,
            align=1,
        )

    page.insert_text(fitz.Point(24, 390), "Issues Found", fontsize=10, fontname="helvB", color=(0.1, 0.1, 0.1))

    ordered_issues = critical_issues + warning_issues
    max_listed = 30
    y = 406
    line_height = 12
    for issue in ordered_issues[:max_listed]:
        page_num = issue.get("page")
        try:
            page_num_int = int(page_num)
        except Exception:
            page_num_int = "?"
        line = f"Page {page_num_int} — {_make_label(issue)}"
        color = _color_for_normalized(_normalize_severity(issue))
        page.insert_text(
            fitz.Point(24, y),
            _truncate(line, 110),
            fontsize=7,
            fontname="helv",
            color=color,
        )
        y += line_height

    hidden = len(ordered_issues) - max_listed
    if hidden > 0:
        page.insert_text(
            fitz.Point(24, y),
            f"... and {hidden} more",
            fontsize=7,
            fontname="helv",
            color=_GREY_TEXT,
        )

    page.insert_textbox(
        fitz.Rect(0, 812, _A4_WIDTH, 830),
        "Generated by manu2print.com — KDP PDF Checker",
        fontsize=7,
        fontname="helv",
        color=_GREY_TEXT,
        align=1,
    )


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

    page_issues_raw = report.get("page_issues")
    page_issues: list[dict[str, Any]] = page_issues_raw if isinstance(page_issues_raw, list) else []
    page_issues_map: dict[int, list[dict[str, Any]]] = {}
    for issue in page_issues:
        try:
            page_index = int(issue.get("page", 1)) - 1
        except Exception:
            continue
        if page_index < 0:
            continue
        page_issues_map.setdefault(page_index, []).append(issue)

    buf = io.BytesIO()
    doc = fitz.open(str(path_in))
    new_doc = fitz.open()
    try:
        _draw_summary_page(new_doc, report, path_in.name)
        for i in range(len(doc)):
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            issues = page_issues_map.get(i, [])
            if not issues:
                continue
            page = new_doc[-1]
            for issue in issues:
                bbox = issue.get("bbox")
                if not bbox or len(bbox) < 4:
                    continue
                try:
                    x, y, w, h = float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])
                except Exception:
                    continue
                if w < 2 or h < 2:
                    continue
                severity = _normalize_severity(issue)
                color = _color_for_normalized(severity)
                page.draw_rect(fitz.Rect(x, y, x + w, y + h), color=color, fill=None, width=2.0)
                label = _make_label(issue)
                label_y = max(y - 4, 8)
                page.insert_text(fitz.Point(x, label_y), label, fontsize=6, color=color)
        new_doc.save(buf)
    finally:
        doc.close()
        new_doc.close()

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
