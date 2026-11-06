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

# KDP paperback custom trim range (inches -> points)
CUSTOM_MIN_W_PT, CUSTOM_MAX_W_PT = 4.0 * POINTS_PER_INCH, 8.5 * POINTS_PER_INCH
CUSTOM_MIN_H_PT, CUSTOM_MAX_H_PT = 6.0 * POINTS_PER_INCH, 11.69 * POINTS_PER_INCH

# Current KDP paperback maximums by trim and interior stock. The checker asks
# for the paper/color tier so it can avoid treating every paperback as 828 pages.
_PAPERBACK_MAX_BY_TRIM = {
    (5.00, 8.00): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (5.06, 7.81): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (5.25, 8.00): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (5.50, 8.50): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (6.00, 9.00): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (6.14, 9.21): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (6.69, 9.61): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (7.00, 10.00): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (7.44, 9.69): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (7.50, 9.25): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (8.00, 10.00): {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828},
    (8.25, 8.25): {"white": 800, "cream": 750, "groundwood": 784, "standard-color": 600, "premium-color": 800},
    (8.50, 8.50): {"white": 590, "cream": 550, "groundwood": 578, "standard-color": 600, "premium-color": 590},
    (8.25, 6.00): {"white": 800, "cream": 750, "groundwood": 784, "standard-color": 600, "premium-color": 800},
    (8.50, 11.00): {"white": 590, "cream": 550, "groundwood": 578, "standard-color": 600, "premium-color": 590},
    (8.27, 11.69): {"white": 780, "cream": 730, "groundwood": 764, "standard-color": 0, "premium-color": 590},
}

# Most trims (and custom sizes): KDP page maximum by paper.
_PAPERBACK_MAX_DEFAULT = {"white": 828, "cream": 776, "groundwood": 812, "standard-color": 600, "premium-color": 828}
STANDARD_COLOR_MIN = 72


def _paperback_max_for(doc: dict[str, Any]) -> tuple[int, str] | None:
    analysis = doc.get("analysis", {})
    options = analysis.get("print_options", {})
    w, h = analysis.get("trim_width_in"), analysis.get("trim_height_in")
    if not isinstance(w, (int, float)) or not isinstance(h, (int, float)):
        return None
    key = next(((tw, th) for tw, th in _PAPERBACK_MAX_BY_TRIM
                if abs(w - tw) <= 0.02 and abs(h - th) <= 0.02), None)
    tier = options.get("paper_type")
    if key is None:
        # Custom trim: KDP's limit for most sizes.
        maximum = _PAPERBACK_MAX_DEFAULT.get(tier)
        return (maximum, tier) if isinstance(maximum, int) else None
    maximum = _PAPERBACK_MAX_BY_TRIM[key].get(tier)
    return (maximum, tier) if isinstance(maximum, int) else None


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


# ─────────────────────────────────────────────────────────────────────────────
# PAGE COUNT
# ─────────────────────────────────────────────────────────────────────────────

def rule_min_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 1: Minimum 24 pages (KDP hard requirement)."""
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    options = doc.get("analysis", {}).get("print_options", {})
    if options.get("book_type") == "hardcover":
        minimum, label = 75, "KDP hardcovers need"
    elif options.get("paper_type") == "standard-color":
        minimum, label = STANDARD_COLOR_MIN, "KDP standard color paperbacks need"
    else:
        minimum, label = PAPERBACK_MIN, "KDP paperbacks need"
    if n < minimum:
        hint = " Premium color allows 24 pages." if minimum == STANDARD_COLOR_MIN else ""
        return [_issue(1, "MIN_PAGE_COUNT", "ERROR",
                       f"Your PDF has {n} pages. {label} at least {minimum} pages.{hint}")]
    return []


def rule_max_page_count(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 2: Enforce the selected KDP book and paper/color page maximum."""
    n = doc.get("analysis", {}).get("page_count") or doc.get("parsed", {}).get("page_count") or 0
    issues = []
    if doc.get("analysis", {}).get("print_options", {}).get("book_type") == "hardcover":
        return [_issue(1, "MAX_PAGE_COUNT", "ERROR", "KDP hardcover maximum is 550 pages.")] if n > HARDCOVER_MAX else []
    limit_info = _paperback_max_for(doc)
    maximum = limit_info[0] if limit_info else PAPERBACK_MAX
    tier_label = limit_info[1] if limit_info else "selected paperback"
    if maximum == 0:
        return [_issue(1, "MAX_PAGE_COUNT", "ERROR", "Standard color is not available for the selected KDP trim size.")]
    if n > maximum:
        issues.append(_issue(1, "MAX_PAGE_COUNT", "ERROR",
                             f"Your PDF has {n} pages. The KDP maximum for this {tier_label} paperback is {maximum} pages."))
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
        w, h = p.get("trim_width_pt", p.get("width")), p.get("trim_height_pt", p.get("height"))
        allowed = ALLOWED_TRIM_POINTS
        is_hardcover = doc.get("analysis", {}).get("print_options", {}).get("book_type") == "hardcover"
        if is_hardcover:
            allowed = {(a * 72, b * 72) for a, b in [(5.5,8.5),(6,9),(6.14,9.21),(7,10),(8.25,11)]}
        matched = any(
            abs(w - a) <= TOLERANCE_PT * 2 and abs(h - b) <= TOLERANCE_PT * 2
            for a, b in allowed
        )
        # KDP paperbacks accept any custom trim from 4" to 8.5" wide and
        # 6" to 11.69" tall (KDP Print Options, checked 2026-11-06).
        if not matched and not is_hardcover:
            matched = (CUSTOM_MIN_W_PT - TOLERANCE_PT <= w <= CUSTOM_MAX_W_PT + TOLERANCE_PT
                       and CUSTOM_MIN_H_PT - TOLERANCE_PT <= h <= CUSTOM_MAX_H_PT + TOLERANCE_PT)
        if not matched:
            reported_pages.add(pn)
            w_in = w / POINTS_PER_INCH
            h_in = h / POINTS_PER_INCH
            issues.append(_issue(
                pn,
                "ALLOWED_TRIM_SIZES",
                "ERROR",
                f"Page size {w_in:.3f}\" × {h_in:.3f}\" is not a KDP-supported trim size. "
                + ("KDP hardcovers allow 5.5×8.5\", 6×9\", 6.14×9.21\", 7×10\" or 8.25×11\". " if is_hardcover
                   else "KDP paperbacks allow 4\" to 8.5\" wide and 6\" to 11.69\" tall. ")
                + "Your PDF page dimensions must exactly match your KDP title setup.",
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
    """Rule 5: With bleed chosen, pages must be larger than the trim size.

    The trim is worked out by taking the bleed off the page, so a file exported
    without bleed shows up as a page that is exactly a standard trim size.
    """
    pages = doc.get("analysis", {}).get("pages") or []
    if not pages:
        return []
    w, h = pages[0]["width"], pages[0]["height"]
    if not pages[0].get("has_bleed"):
        # No bleed chosen, but the page is a standard trim plus bleed: the
        # author most likely made a bleed file and picked the wrong option.
        match = next(((a, b) for a, b in ALLOWED_TRIM_POINTS
                      if abs(w - (a + BLEED_EXTRA_PT)) <= TOLERANCE_PT
                      and abs(h - (b + 2 * BLEED_EXTRA_PT)) <= TOLERANCE_PT), None)
        if not match:
            return []
        t_w, t_h = match[0] / POINTS_PER_INCH, match[1] / POINTS_PER_INCH
        return [_issue(
            1,
            "BLEED_VALIDATION",
            "WARNING",
            f"You chose No bleed, but your pages are {w / POINTS_PER_INCH:.3f}\" × {h / POINTS_PER_INCH:.3f}\", "
            f"which is exactly a {t_w:g}\" × {t_h:g}\" book with bleed added. If you meant a {t_w:g}\" × {t_h:g}\" book, "
            "scan again with With bleed. If not, KDP will print it at this size as a custom trim.",
            None,
        )]
    if not any(abs(w - a) <= TOLERANCE_PT and abs(h - b) <= TOLERANCE_PT for a, b in ALLOWED_TRIM_POINTS):
        return []
    w_in, h_in = w / POINTS_PER_INCH, h / POINTS_PER_INCH
    return [_issue(
        1,
        "BLEED_VALIDATION",
        "ERROR",
        f"You chose With bleed, but your pages are exactly {w_in:.3g}\" × {h_in:.3g}\", "
        "a trim size with no bleed added. For a bleed book each page must be "
        f"{w_in + BLEED_EXTRA_IN:.3f}\" × {h_in + BLEED_EXTRA_IN * 2:.3f}\". "
        "Re-export with 0.125\" bleed, or choose No bleed if nothing runs to the edge.",
        None,
    )]


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
