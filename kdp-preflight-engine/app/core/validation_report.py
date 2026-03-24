"""
Validation report: compiles results from rules engine into the API response format.
Includes KDP Rejection Risk Score (0–100) with letter grade.
"""
from __future__ import annotations

from app.schemas import PageIssue, ScoreGrade, ValidationReport, ValidationSummary

# ─────────────────────────────────────────────────────────────────────────────
# SCORING WEIGHTS
# Rules that cause automatic KDP rejection get critical weight (-25).
# Other errors use high weight (-12). Warnings are minor (-3).
# ─────────────────────────────────────────────────────────────────────────────
AUTO_REJECT_RULES = frozenset({
    "EMBEDDED_FONTS",         # KDP auto-rejects — confirmed from KDP docs
    "TRANSPARENCY_FLATTENING",# KDP misrenders or rejects
    "INTERACTIVE_ELEMENTS",   # KDP strips / rejects
    "MAX_PAGE_COUNT",         # Hard limit
    "MIN_PAGE_COUNT",         # Hard limit
})

SEVERITY_DEDUCTIONS: dict[str, int] = {
    "critical":  25,  # Auto-reject rule fired
    "high":      12,  # Serious error
    "major":     12,
    "moderate":   5,
    "medium":     5,
    "minor":      3,
    "low":        2,
}

# Score bands for letter grade
SCORE_GRADES = [
    (95, 100, "A+", "KDP Ready",       "Your PDF meets all KDP requirements. Safe to upload."),
    (85,  94, "A",  "Ready",           "Minor issues found. Fix the warnings for best results."),
    (70,  84, "B",  "Nearly Ready",    "A few issues to address before uploading."),
    (50,  69, "C",  "Needs Work",      "Multiple issues detected. Fix errors before submitting."),
    (25,  49, "D",  "Major Issues",    "Serious problems found. KDP will likely reject this file."),
    (0,   24, "F",  "Will Be Rejected","Critical issues detected. This file will be rejected by KDP."),
]


def _normalize_severity(issue: dict) -> str:
    """Normalize issue severity to weighted bucket."""
    rule_id = str(issue.get("rule_id", "")).strip()
    raw = str(issue.get("severity", "")).strip().lower()

    # Auto-reject rules always score as critical
    if rule_id in AUTO_REJECT_RULES and raw == "error":
        return "critical"

    if raw in SEVERITY_DEDUCTIONS:
        return raw
    if raw == "error":
        return "high"
    if raw == "warning":
        return "minor"

    msg = str(issue.get("message", "")).lower()
    text = f"{rule_id.lower()} {msg}"
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
    KDP Rejection Risk Score: 0–100.
    - 95–100: KDP Ready
    - 85–94:  Ready (minor issues)
    - 70–84:  Nearly Ready
    - 50–69:  Needs Work
    - 25–49:  Major Issues
    - 0–24:   Will Be Rejected

    Auto-reject rules (non-embedded fonts, transparency, interactive elements)
    deduct 25 points each — enough to make the score fail on their own.
    """
    total_issues = len(errors) + len(warnings)
    if total_issues == 0:
        return 97  # Perfect score with no issues

    deduction = 0
    for issue in errors:
        sev = _normalize_severity(issue)
        deduction += SEVERITY_DEDUCTIONS.get(sev, 12)
    for issue in warnings:
        sev = _normalize_severity(issue)
        deduction += SEVERITY_DEDUCTIONS.get(sev, 3)

    return max(0, min(100, 100 - deduction))


def get_score_grade(score: int) -> dict[str, str]:
    """Return grade metadata for a given score."""
    for low, high, grade, label, description in SCORE_GRADES:
        if low <= score <= high:
            return {
                "grade": grade,
                "label": label,
                "description": description,
            }
    return {"grade": "F", "label": "Will Be Rejected", "description": "Critical issues detected."}


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
    ruleset_version: str = "kdp_preflight_v2.0.0",
    file_hash: str = "",
    file_size: int = 0,
    creation_tool: str = "unknown",
) -> ValidationReport:
    """Build ValidationReport from rule outputs."""
    status = "FAIL" if errors else "PASS"
    readiness_score = calculate_readiness_score(errors, warnings)
    approval_likelihood = readiness_score
    score_grade = get_score_grade(readiness_score)

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

    err_issues  = [PageIssue(page=e["page"], rule_id=e["rule_id"], severity=e["severity"], message=e["message"], bbox=bbox_to_xywh(e.get("bbox"))) for e in errors]
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
        score_grade=ScoreGrade(**score_grade),
        creation_tool=creation_tool,
        errors=err_issues,
        warnings=warn_issues,
        summary=summary,
        page_issues=all_issues,
    )
