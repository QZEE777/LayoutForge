"""
Document analyzer: derives layout elements and metadata from parsed PDF data.
Computes margins, safe zones, and structured layout for the rules engine.
"""
from __future__ import annotations

from app.core.pdf_parser import (
    ALLOWED_TRIM_POINTS,
    POINTS_PER_INCH,
    parse_pdf,
)
from pathlib import Path
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# KDP GUTTER (INSIDE MARGIN) TABLE — exact values from KDP published spec
# Applies to white and cream paper (standard paperbacks).
# Color paper gutter diverges at 300–400 pages (see KDP help).
# ─────────────────────────────────────────────────────────────────────────────
GUTTER_BY_PAGES = [
    (24,  150, 0.375),
    (151, 300, 0.500),
    (301, 500, 0.625),
    (501, 700, 0.750),
    (701, 828, 0.875),  # KDP requires 0.875" for 701+ pages (was incorrectly 0.75)
]

MIN_OUTSIDE_MARGIN_IN = 0.25
MIN_TOP_MARGIN_IN     = 0.25
MIN_BOTTOM_MARGIN_IN  = 0.25
BLEED_IN              = 0.125

# Hardcover page limit (separate from paperback 828 limit)
HARDCOVER_MAX_PAGES = 550
PAPERBACK_MAX_PAGES = 828


def gutter_inches(page_count: int) -> float:
    """Return KDP required inside gutter in inches for the given page count."""
    for low, high, gutter in GUTTER_BY_PAGES:
        if low <= page_count <= high:
            return gutter
    return 0.875  # fallback for any count above 828 (error caught by max-page rule)


def detect_creation_tool(creator_info: dict[str, str]) -> str:
    """
    Detect which tool created the PDF from creator/producer metadata.
    Returns a normalized tool key for use in fix instructions.
    """
    creator = (creator_info.get("creator") or "").lower()
    producer = (creator_info.get("producer") or "").lower()
    combined = f"{creator} {producer}"

    if "microsoft word" in combined or "word" in combined:
        return "microsoft_word"
    if "indesign" in combined:
        return "adobe_indesign"
    if "affinity publisher" in combined or "affinity" in combined:
        return "affinity_publisher"
    if "canva" in combined:
        return "canva"
    if "vellum" in combined:
        return "vellum"
    if "scrivener" in combined:
        return "scrivener"
    if "libreoffice" in combined or "openoffice" in combined:
        return "libreoffice"
    if "pages" in combined and "apple" in combined:
        return "apple_pages"
    if "latex" in combined or "tex" in combined or "pdftex" in combined or "xelatex" in combined:
        return "latex"
    if "acrobat" in combined or "adobe" in combined:
        return "adobe_acrobat"
    return "unknown"


def analyze_document(pdf_path: Path) -> dict[str, Any]:
    """
    Parse PDF and enrich with computed layout (margins, safe zone, bleed).
    Returns document dict with 'parsed' and 'analysis' keys.
    """
    parsed = parse_pdf(pdf_path)
    page_count = parsed["page_count"]
    creator_info = parsed.get("creator_info", {})
    creation_tool = detect_creation_tool(creator_info)

    gutter_in  = gutter_inches(page_count)
    gutter_pt  = gutter_in * POINTS_PER_INCH
    outside_pt = MIN_OUTSIDE_MARGIN_IN * POINTS_PER_INCH
    top_pt     = MIN_TOP_MARGIN_IN * POINTS_PER_INCH
    bottom_pt  = MIN_BOTTOM_MARGIN_IN * POINTS_PER_INCH
    bleed_pt   = BLEED_IN * POINTS_PER_INCH

    # Odd page count flag — KDP prints in pairs; odd count may need a blank page added
    is_odd_page_count = (page_count % 2) != 0

    pages_analysis: list[dict[str, Any]] = []
    for p in parsed["pages"]:
        w = p["width"]
        h = p["height"]
        trim = p.get("trim_box")

        # Effective trim: use trim box if valid, else full page (MediaBox)
        if trim and len(trim) == 4:
            t_w = trim[2] - trim[0]
            t_h = trim[3] - trim[1]
        else:
            t_w, t_h = w, h
            trim = (0.0, 0.0, w, h)

        # Left = gutter (inside binding), right = outside (fore-edge)
        safe_left   = trim[0] + gutter_pt
        safe_right  = trim[2] - outside_pt
        safe_top    = trim[1] + top_pt
        safe_bottom = trim[3] - bottom_pt

        pages_analysis.append({
            **p,
            "gutter_pt":   gutter_pt,
            "outside_pt":  outside_pt,
            "top_pt":      top_pt,
            "bottom_pt":   bottom_pt,
            "bleed_pt":    bleed_pt,
            "safe_left":   safe_left,
            "safe_right":  safe_right,
            "safe_top":    safe_top,
            "safe_bottom": safe_bottom,
            "trim_rect":   trim,
            "trim_width_pt":  t_w,
            "trim_height_pt": t_h,
        })

    trim_width_in  = pages_analysis[0]["trim_width_pt"]  / POINTS_PER_INCH if pages_analysis else 0.0
    trim_height_in = pages_analysis[0]["trim_height_pt"] / POINTS_PER_INCH if pages_analysis else 0.0

    return {
        "parsed": parsed,
        "analysis": {
            "page_count":        page_count,
            "gutter_inches":     gutter_in,
            "trim_width_in":     trim_width_in,
            "trim_height_in":    trim_height_in,
            "is_odd_page_count": is_odd_page_count,
            "creation_tool":     creation_tool,
            "creator_info":      creator_info,
            "pages":             pages_analysis,
            "allowed_trim_points": ALLOWED_TRIM_POINTS,
        },
    }
