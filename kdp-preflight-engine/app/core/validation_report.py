"""
Validation report: compiles results from rules engine into the API response format.
"""
from __future__ import annotations

from app.schemas import PageIssue, ValidationReport, ValidationSummary

SEVERITY_DEDUCTIONS: dict[str, int] = {
    "critical": 15,
    "high": 8,
    "major": 8,
    "moderate": 3,
    "medium": 3,
    "minor": 1,
    "low": 1,
}


def _normalize_severity(issue: dict) -> str:
    """
    Normalize incoming severity labels from rules output to weighted buckets.
    Falls back by message/rule hints and finally by lane (error/warning defaulting in caller).
    """
    raw = str(issue.get("severity", "")).strip().lower()
    if raw in SEVERITY_DEDUCTIONS:
        return raw
    if raw == "error":
        return "high"
    if raw == "warning":
        return "minor"

    msg = str(issue.get("message", "")).lower()
    rule_id = str(issue.get("rule_id", "")).lower()
    text = f"{rule_id} {msg}"
    if "critical" in text:
        return "critical"
    if "major" in text or "high" in text:
        return "high"
    if "moderate" in text or "medium" in text:
        return "moderate"
    if "minor" in text or "low" in text:
        return "minor"
    return "high"


def calculate_readiness_score(errors: list[dict], warnings: list[dict]) -> int:
    """
    Weighted readiness score:
    - Base 100
    - Critical: -15, High/Major: -8, Moderate/Medium: -3, Minor/Low: -1
    - Zero issues => 95
    - Clamp to [0, 100]
    """
    total_issues = len(errors) + len(warnings)
    if total_issues == 0:
        return 95

    deduction = 0
    for issue in errors:
        sev = _normalize_severity(issue)
        deduction += SEVERITY_DEDUCTIONS.get(sev, 8)
    for issue in warnings:
        sev = _normalize_severity(issue)
        deduction += SEVERITY_DEDUCTIONS.get(sev, 1)

    return max(0, min(100, 100 - deduction))


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
    readiness_score = calculate_readiness_score(errors, warnings)
    approval_likelihood = readiness_score
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
        readiness_score=readiness_score,
        approval_likelihood=approval_likelihood,
        errors=err_issues,
        warnings=warn_issues,
        summary=summary,
        page_issues=all_issues,
    )
