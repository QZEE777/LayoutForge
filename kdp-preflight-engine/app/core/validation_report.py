"""
Validation report: compiles results from rules engine into the API response format.
"""
from __future__ import annotations

from app.schemas import PageIssue, ValidationReport, ValidationSummary


def bbox_to_xywh(bbox: list[float] | None) -> list[float] | None:
    """Convert [x0,y0,x1,y1] to [x, y, width, height] for frontend."""
    if not bbox or len(bbox) < 4:
        return None
    x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
    return [x0, y0, x1 - x0, y1 - y0]


def build_report(
    page_count: int,
    errors: list[dict],
    warnings: list[dict],
    rules_checked: int,
    ruleset_version: str = "kdp_preflight_v1.0.0",
    file_hash: str = "",
    file_size: int = 0,
) -> ValidationReport:
    """Build ValidationReport from rule outputs."""
    status = "FAIL" if errors else "PASS"
    all_issues: list[PageIssue] = []
    for e in errors:
        all_issues.append(PageIssue(
            page=e["page"],
            rule_id=e["rule_id"],
            severity=e["severity"],
            message=e["message"],
            bbox=bbox_to_xywh(e.get("bbox")),
        ))
    for w in warnings:
        all_issues.append(PageIssue(
            page=w["page"],
            rule_id=w["rule_id"],
            severity=w["severity"],
            message=w["message"],
            bbox=bbox_to_xywh(w.get("bbox")),
        ))
    err_issues = [PageIssue(page=e["page"], rule_id=e["rule_id"], severity=e["severity"], message=e["message"], bbox=bbox_to_xywh(e.get("bbox"))) for e in errors]
    warn_issues = [PageIssue(page=w["page"], rule_id=w["rule_id"], severity=w["severity"], message=w["message"], bbox=bbox_to_xywh(w.get("bbox"))) for w in warnings]
    summary = ValidationSummary(
        total_pages=page_count,
        error_count=len(errors),
        warning_count=len(warnings),
        rules_checked=rules_checked,
    )
    return ValidationReport(
        file_hash=file_hash,
        file_size=file_size,
        ruleset_version=ruleset_version,
        status=status,
        errors=err_issues,
        warnings=warn_issues,
        summary=summary,
        page_issues=all_issues,
    )
