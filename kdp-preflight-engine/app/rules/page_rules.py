"""
Page-level KDP rules: count, trim, orientation, rotation, transparency,
interactive elements, odd page count, bleed, PDF version.
"""
from __future__ import annotations

from typing import Any

from app.core.pdf_parser import ALLOWED_TRIM_POINTS, POINTS_PER_INCH

BLEED_EXTRA_IN = 0.125
BLEED_EXTRA_PT = BLEED_EXTRA_IN * POINTS_PER_INCH
TOLERANCE_PT   = 1.0   # 1pt ≈ 0.014" — tight tolerance for dimension matching

# KDP page count limits
PAPERBACK_MAX = 828
HARDCOVER_MAX = 550
PAPERBACK_MIN = 24


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


# ─────────────────────────────────────────────────────────────────────────────
# PAGE COUNT
# ─────────────────────────────────────────────────────────────────────────────

def rule_min_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 1: Minimum 24 pages (KDP hard requirement)."""
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    if n < PAPERBACK_MIN:
        return [_issue(1, "MIN_PAGE_COUNT", "ERROR",
                       f"Your PDF has {n} pages. KDP requires a minimum of 24 pages for all print formats.")]
    return []


def rule_max_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 2: Maximum 828 pages for paperback; warns at 550 for potential hardcover use."""
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    issues = []
    if n > PAPERBACK_MAX:
        issues.append(_issue(1, "MAX_PAGE_COUNT", "ERROR",
                             f"Your PDF has {n} pages. KDP paperback maximum is 828 pages."))
    elif n > HARDCOVER_MAX:
        issues.append(_issue(1, "MAX_PAGE_COUNT", "WARNING",
                             f"Your PDF has {n} pages. KDP hardcover maximum is 550 pages — "
                             "if publishing hardcover, reduce page count before uploading."))
    return issues


def rule_odd_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    New rule: Odd page count warning.
    Books are printed in pairs (front + back). An odd page count causes KDP
    to automatically add a blank page — this can shift pagination and page numbers.
    """
    is_odd = doc.get("analysis", {}).get("is_odd_page_count", False)
    n = doc.get("analysis", {}).get("page_count") or 0
    if is_odd and n > 0:
        return [_issue(1, "ODD_PAGE_COUNT", "WARNING",
                       f"Your PDF has {n} pages (odd number). KDP prints in pairs — "
                       "an extra blank page will be added automatically at the end, "
                       "which may shift your page numbering. Add a blank final page to control this.")]
    return []


# ─────────────────────────────────────────────────────────────────────────────
# DIMENSIONS & TRIM
# ─────────────────────────────────────────────────────────────────────────────

def rule_consistent_trim_size(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 3: All pages must have identical dimensions."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    if not pages:
        return issues
    first_w, first_h = pages[0].get("width"), pages[0].get("height")
    for p in pages[1:]:
        w, h = p.get("width"), p.get("height")
        if abs(w - first_w) > TOLERANCE_PT or abs(h - first_h) > TOLERANCE_PT:
            issues.append(_issue(
                p.get("page_number", 0),
                "CONSISTENT_TRIM",
                "ERROR",
                f"Page {p.get('page_number')} is {w/POINTS_PER_INCH:.3f}\" × {h/POINTS_PER_INCH:.3f}\" "
                f"but page 1 is {first_w/POINTS_PER_INCH:.3f}\" × {first_h/POINTS_PER_INCH:.3f}\". "
                "All pages must be identical dimensions. KDP cannot print documents with variable page sizes.",
                None,
            ))
    return issues


def rule_allowed_trim_sizes(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 4: Page dimensions must match a KDP-supported trim size."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    reported_pages: set[int] = set()

    for p in pages:
        pn = p.get("page_number", 0)
        if pn in reported_pages:
            continue
        w, h = p.get("width"), p.get("height")
        matched = any(
            abs(w - a) <= TOLERANCE_PT * 2 and abs(h - b) <= TOLERANCE_PT * 2
            for a, b in ALLOWED_TRIM_POINTS
        )
        if not matched:
            reported_pages.add(pn)
            w_in = w / POINTS_PER_INCH
            h_in = h / POINTS_PER_INCH
            issues.append(_issue(
                pn,
                "ALLOWED_TRIM_SIZES",
                "ERROR",
                f"Page size {w_in:.3f}\" × {h_in:.3f}\" is not a KDP-supported trim size. "
                "Common sizes: 5×8\", 5.5×8.5\", 6×9\", 7×10\", 8.5×11\". "
                "Your PDF page dimensions must exactly match your KDP title setup.",
                None,
            ))
    return issues


def rule_mixed_page_sizes(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 23: Reject mixed page dimensions (same as rule 3, reinforced)."""
    return rule_consistent_trim_size(doc)


# ─────────────────────────────────────────────────────────────────────────────
# BLEED
# ─────────────────────────────────────────────────────────────────────────────

def rule_bleed_validation(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 5: If a bleed box is present, it must extend 0.125\" beyond trim."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim  = p.get("trim_rect") or p.get("trim_box")
        bleed = p.get("bleed_box")
        if not trim or len(trim) != 4:
            continue
        if not bleed or len(bleed) != 4:
            continue
        t_w = trim[2] - trim[0]
        t_h = trim[3] - trim[1]
        b_w = bleed[2] - bleed[0]
        b_h = bleed[3] - bleed[1]
        required_w = t_w + BLEED_EXTRA_PT * 2
        required_h = t_h + BLEED_EXTRA_PT * 2
        if b_w < required_w - TOLERANCE_PT or b_h < required_h - TOLERANCE_PT:
            issues.append(_issue(
                p.get("page_number", 0),
                "BLEED_VALIDATION",
                "ERROR",
                f"Bleed area is {b_w/POINTS_PER_INCH:.3f}\" × {b_h/POINTS_PER_INCH:.3f}\" but must extend "
                f"0.125\" beyond trim ({required_w/POINTS_PER_INCH:.3f}\" × {required_h/POINTS_PER_INCH:.3f}\"). "
                "Full-bleed images will be cropped at the trim edge.",
                None,
            ))
    return issues


# ─────────────────────────────────────────────────────────────────────────────
# PDF STRUCTURE
# ─────────────────────────────────────────────────────────────────────────────

def rule_pdf_version(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 16: PDF version must be 1.3 or higher (KDP accepts 1.3–1.7)."""
    ver = doc.get("parsed", {}).get("pdf_version") or 1.0
    if ver < 1.3:
        return [_issue(1, "PDF_VERSION", "ERROR",
                       f"PDF version {ver:.1f} is not supported. KDP requires PDF 1.3 or higher. "
                       "Re-export from your layout software using a current PDF version.")]
    return []


def rule_transparency_flattening(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Rule 17: All transparency must be flattened before submitting to KDP.

    Uses the real transparency detection from pdf_parser.detect_transparency()
    which checks drawing path opacity values and the PDF /Group key.

    Unflattened transparency causes:
    - Incorrect rendering at print (white boxes, missing content)
    - Potential KDP rejection
    Common source: Canva exports, Affinity Publisher with live effects,
    Illustrator/Photoshop placed objects with blend modes.
    """
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    transparent_pages: list[int] = []

    for p in pages:
        if p.get("has_transparency", False):
            transparent_pages.append(p.get("page_number", 0))

    if transparent_pages:
        shown = transparent_pages[:10]
        pages_str = ", ".join(str(pg) for pg in shown)
        if len(transparent_pages) > 10:
            pages_str += f" (+{len(transparent_pages) - 10} more)"
        issues.append(_issue(
            transparent_pages[0],
            "TRANSPARENCY_FLATTENING",
            "ERROR",
            f"Unflattened transparency detected on pages: {pages_str}. "
            "KDP requires all transparency to be flattened before uploading. "
            "In your design software, use 'Flatten Transparency' or export as PDF/X-1a. "
            "Canva users: export as PDF (Print) not PDF (Standard).",
            None,
        ))

    return issues


def rule_interactive_elements(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    New rule: Reject interactive elements (form fields, widgets, annotations).
    KDP is a print service — interactive PDF elements must be flattened.
    """
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    interactive_pages: list[int] = []

    for p in pages:
        count = p.get("interactive_count", 0)
        if count > 0:
            interactive_pages.append(p.get("page_number", 0))

    if interactive_pages:
        shown = interactive_pages[:5]
        pages_str = ", ".join(str(pg) for pg in shown)
        issues.append(_issue(
            interactive_pages[0],
            "INTERACTIVE_ELEMENTS",
            "ERROR",
            f"Interactive form fields or widgets found on pages: {pages_str}. "
            "KDP prints do not support interactive PDF elements. "
            "Flatten all form fields and annotations before uploading.",
            None,
        ))

    return issues


# ─────────────────────────────────────────────────────────────────────────────
# ORIENTATION & ROTATION
# ─────────────────────────────────────────────────────────────────────────────

def rule_orientation_consistency(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 18: All pages must have the same orientation."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    if not pages:
        return issues
    first_landscape = pages[0].get("width", 0) > pages[0].get("height", 0)
    first_label = "landscape" if first_landscape else "portrait"
    for p in pages[1:]:
        w, h = p.get("width"), p.get("height")
        land = w > h
        if land != first_landscape:
            issues.append(_issue(
                p.get("page_number", 0),
                "ORIENTATION_CONSISTENCY",
                "ERROR",
                f"Page {p.get('page_number')} is {'landscape' if land else 'portrait'} "
                f"but page 1 is {first_label}. KDP does not support mixed-orientation documents.",
                None,
            ))
    return issues


def rule_rotated_pages(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 21: No page rotation allowed (rotation must be 0°)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        rot = p.get("rotation", 0)
        if rot != 0:
            issues.append(_issue(
                p.get("page_number", 0),
                "ROTATED_PAGES",
                "ERROR",
                f"Page {p.get('page_number')} has a PDF rotation of {rot}°. "
                "KDP requires all pages to have 0° rotation. "
                "Remove the rotation in your layout software and re-export.",
                None,
            ))
    return issues


# ─────────────────────────────────────────────────────────────────────────────
# BLANK PAGES
# ─────────────────────────────────────────────────────────────────────────────

def _page_is_truly_blank(p: dict[str, Any]) -> bool:
    """
    A page is blank only if it has no text, no embedded images, and no vector graphics.
    Image-only pages (chapter art, full-page illustrations) must NOT be flagged.
    Uses PyMuPDF primitives: embedded_image_count (get_images), drawing_count (get_drawings).
    """
    raw = p.get("raw_text_stripped")
    has_text = bool(str(raw).strip()) if raw is not None else any(
        (t.get("text") or "").strip() for t in (p.get("text_blocks") or [])
    )

    em = p.get("embedded_image_count")
    has_images = (int(em) > 0) if em is not None else len(p.get("images") or []) > 0

    dc = p.get("drawing_count")
    has_vectors = (int(dc) > 0) if dc is not None else False

    return not has_text and not has_images and not has_vectors


def rule_empty_page_detection(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 19: 0–2 blank pages are normal; 3+ generates a single warning."""
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    blank_pages: list[int] = []
    for p in pages:
        if _page_is_truly_blank(p):
            blank_pages.append(int(p.get("page_number") or 0))

    n = len(blank_pages)
    if n <= 2:
        return []

    sorted_pages = sorted(set(blank_pages))
    shown = sorted_pages[:30]
    pages_str = ", ".join(str(x) for x in shown)
    if len(sorted_pages) > 30:
        pages_str += f" (+{len(sorted_pages) - 30} more)"

    return [_issue(
        sorted_pages[0],
        "EMPTY_PAGE",
        "WARNING",
        f"{n} pages appear completely blank (pages: {pages_str}). "
        "1–2 blank pages are normal in print books (e.g. verso of title page). "
        "Many blank pages usually indicates an export or formatting issue — verify your document.",
        None,
    )]


# ─────────────────────────────────────────────────────────────────────────────
# TRIM BOX
# ─────────────────────────────────────────────────────────────────────────────

def rule_trim_box_validation(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 24: Trim box must be valid if present; MediaBox-only is acceptable."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_box")
        w, h = p.get("width"), p.get("height")
        if not trim or len(trim) != 4:
            continue
        tw = trim[2] - trim[0]
        th = trim[3] - trim[1]
        if tw <= 0 or th <= 0:
            issues.append(_issue(
                p.get("page_number", 0),
                "TRIM_BOX",
                "ERROR",
                "TrimBox has zero or negative dimensions — this PDF has a corrupt trim box. "
                "Re-export from your layout software.",
                list(trim),
            ))
        elif abs(tw - w) > TOLERANCE_PT * 3 or abs(th - h) > TOLERANCE_PT * 3:
            issues.append(_issue(
                p.get("page_number", 0),
                "TRIM_BOX",
                "WARNING",
                f"TrimBox ({tw/POINTS_PER_INCH:.3f}\" × {th/POINTS_PER_INCH:.3f}\") does not match "
                f"page dimensions ({w/POINTS_PER_INCH:.3f}\" × {h/POINTS_PER_INCH:.3f}\"). "
                "KDP uses the TrimBox to determine where to cut — this mismatch may cause incorrect trimming.",
                list(trim),
            ))
    return issues
