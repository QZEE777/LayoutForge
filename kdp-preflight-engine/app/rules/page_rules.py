"""Page-level KDP rules: count, trim, orientation, rotation, empty pages, PDF version."""
from __future__ import annotations

from typing import Any

from app.core.pdf_parser import ALLOWED_TRIM_POINTS, POINTS_PER_INCH

BLEED_EXTRA_IN = 0.125
BLEED_EXTRA_PT = BLEED_EXTRA_IN * POINTS_PER_INCH
TOLERANCE_PT = 1.0  # allow 1pt tolerance when comparing dimensions


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def rule_min_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 1: Minimum 24 pages."""
    issues = []
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    if n < 24:
        issues.append(_issue(1, "MIN_PAGE_COUNT", "ERROR", f"Page count {n} is below KDP minimum of 24."))
    return issues


def rule_max_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 2: Maximum 828 pages."""
    issues = []
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    if n > 828:
        issues.append(_issue(1, "MAX_PAGE_COUNT", "ERROR", f"Page count {n} exceeds KDP maximum of 828."))
    return issues


def rule_consistent_trim_size(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 3: All pages must have identical dimensions."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    if not pages:
        return issues
    first_w, first_h = pages[0].get("width"), pages[0].get("height")
    for p in pages:
        w, h = p.get("width"), p.get("height")
        if abs(w - first_w) > TOLERANCE_PT or abs(h - first_h) > TOLERANCE_PT:
            issues.append(_issue(
                p.get("page_number", 0),
                "CONSISTENT_TRIM",
                "ERROR",
                f"Page dimensions ({w:.1f}x{h:.1f} pt) differ from first page ({first_w:.1f}x{first_h:.1f} pt).",
                None,
            ))
    return issues


def rule_allowed_trim_sizes(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 4: Allowed trim sizes (5x8, 5.25x8, 5.5x8.5, 6x9, 7x10, 8.5x11)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        w, h = p.get("width"), p.get("height")
        matched = any(
            abs(w - a) <= 2 and abs(h - b) <= 2
            for a, b in ALLOWED_TRIM_POINTS
        )
        if not matched:
            issues.append(_issue(
                p.get("page_number", 0),
                "ALLOWED_TRIM_SIZES",
                "ERROR",
                f"Trim size {w/POINTS_PER_INCH:.2f}\" x {h/POINTS_PER_INCH:.2f}\" is not a KDP allowed size.",
                None,
            ))
    return issues


def rule_bleed_validation(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 5: If bleed is used, page must extend 0.125\" beyond trim."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_rect") or p.get("trim_box")
        bleed = p.get("bleed_box")
        if not trim or len(trim) != 4:
            continue
        # If there is a bleed box and it differs from trim, it should extend by 0.125"
        if bleed and len(bleed) == 4:
            t_w = trim[2] - trim[0]
            t_h = trim[3] - trim[1]
            b_w = bleed[2] - bleed[0]
            b_h = bleed[3] - bleed[1]
            if b_w < t_w + BLEED_EXTRA_PT * 2 - TOLERANCE_PT or b_h < t_h + BLEED_EXTRA_PT * 2 - TOLERANCE_PT:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "BLEED_VALIDATION",
                    "WARNING",
                    "Bleed area should extend 0.125\" beyond trim when bleed is used.",
                    None,
                ))
    return issues


def rule_pdf_version(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 16: PDF version 1.4 or higher."""
    issues = []
    ver = doc.get("parsed", {}).get("pdf_version") or 1.0
    if ver < 1.4:
        issues.append(_issue(1, "PDF_VERSION", "ERROR", f"PDF version {ver} is below required 1.4."))
    return issues


def rule_transparency_flattening(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 17: Transparency must be flattened. PyMuPDF doesn't expose transparency easily; we report if we detect issues."""
    # MVP: We don't have reliable transparency detection without deep PDF inspection. Pass with no issue.
    return []


def rule_orientation_consistency(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 18: All pages same orientation (portrait or landscape)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    if not pages:
        return issues
    first_landscape = pages[0].get("width", 0) > pages[0].get("height", 0)
    for p in pages:
        w, h = p.get("width"), p.get("height")
        land = w > h
        if land != first_landscape:
            issues.append(_issue(
                p.get("page_number", 0),
                "ORIENTATION_CONSISTENCY",
                "ERROR",
                "Page orientation differs from rest of document.",
                None,
            ))
    return issues


def rule_empty_page_detection(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 19: Detect unintended blank pages in body (no text, no images)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        texts = p.get("text_blocks") or []
        imgs = p.get("images") or []
        has_text = any((t.get("text") or "").strip() for t in texts)
        if not has_text and not imgs:
            issues.append(_issue(
                p.get("page_number", 0),
                "EMPTY_PAGE",
                "WARNING",
                "Page appears to be blank (no text or images).",
                None,
            ))
    return issues


def rule_rotated_pages(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 21: Reject rotated page layouts (rotation != 0)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        rot = p.get("rotation", 0)
        if rot != 0:
            issues.append(_issue(
                p.get("page_number", 0),
                "ROTATED_PAGES",
                "ERROR",
                f"Page has rotation {rot}°. KDP requires unrotated pages.",
                None,
            ))
    return issues


def rule_mixed_page_sizes(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 23: Reject mixed page dimensions (same as rule 3, reinforced)."""
    return rule_consistent_trim_size(doc)


def rule_trim_box_validation(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 24: PDF must contain valid trim box (or use MediaBox as trim)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_box")
        w, h = p.get("width"), p.get("height")
        if not trim or len(trim) != 4:
            # Many PDFs use MediaBox only; that's acceptable. Only warn if we expected trim.
            continue
        tw = trim[2] - trim[0]
        th = trim[3] - trim[1]
        if tw <= 0 or th <= 0:
            issues.append(_issue(
                p.get("page_number", 0),
                "TRIM_BOX",
                "ERROR",
                "Invalid trim box (zero or negative size).",
                list(trim),
            ))
        elif abs(tw - w) > TOLERANCE_PT * 2 or abs(th - h) > TOLERANCE_PT * 2:
            issues.append(_issue(
                p.get("page_number", 0),
                "TRIM_BOX",
                "WARNING",
                "Trim box does not match page dimensions.",
                list(trim),
            ))
    return issues
