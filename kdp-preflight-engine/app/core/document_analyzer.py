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

# Gutter (inside margin) in inches by page count (KDP rule)
GUTTER_BY_PAGES = [
    (24, 150, 0.375),
    (151, 300, 0.5),
    (301, 500, 0.625),
    (501, 700, 0.75),
    (701, 828, 0.75),
]
MIN_OUTSIDE_MARGIN_IN = 0.25
MIN_TOP_MARGIN_IN = 0.25
MIN_BOTTOM_MARGIN_IN = 0.25
BLEED_IN = 0.125


def gutter_inches(page_count: int) -> float:
    """KDP gutter in inches for given page count."""
    for low, high, gutter in GUTTER_BY_PAGES:
        if low <= page_count <= high:
            return gutter
    return 0.75  # fallback for 701+


def analyze_document(pdf_path: Path) -> dict[str, Any]:
    """
    Parse PDF and enrich with computed layout (margins, safe zone, bleed).
    Returns document dict with 'parsed' and 'analysis' keys.
    """
    parsed = parse_pdf(pdf_path)
    page_count = parsed["page_count"]
    gutter_in = gutter_inches(page_count)
    gutter_pt = gutter_in * POINTS_PER_INCH
    outside_pt = MIN_OUTSIDE_MARGIN_IN * POINTS_PER_INCH
    top_pt = MIN_TOP_MARGIN_IN * POINTS_PER_INCH
    bottom_pt = MIN_BOTTOM_MARGIN_IN * POINTS_PER_INCH
    bleed_pt = BLEED_IN * POINTS_PER_INCH

    pages_analysis: list[dict[str, Any]] = []
    for p in parsed["pages"]:
        w = p["width"]
        h = p["height"]
        trim = p.get("trim_box")
        # Effective trim: use trim box if valid, else full page
        if trim and len(trim) == 4:
            t_w = trim[2] - trim[0]
            t_h = trim[3] - trim[1]
        else:
            t_w, t_h = w, h
            trim = (0, 0, w, h)

        # Left = gutter (inside), right = outside
        safe_left = trim[0] + gutter_pt
        safe_right = trim[2] - outside_pt
        safe_top = trim[1] + top_pt
        safe_bottom = trim[3] - bottom_pt

        pages_analysis.append({
            **p,
            "gutter_pt": gutter_pt,
            "outside_pt": outside_pt,
            "top_pt": top_pt,
            "bottom_pt": bottom_pt,
            "bleed_pt": bleed_pt,
            "safe_left": safe_left,
            "safe_right": safe_right,
            "safe_top": safe_top,
            "safe_bottom": safe_bottom,
            "trim_rect": trim,
            "trim_width_pt": t_w,
            "trim_height_pt": t_h,
        })

    return {
        "parsed": parsed,
        "analysis": {
            "page_count": page_count,
            "gutter_inches": gutter_in,
            "pages": pages_analysis,
            "allowed_trim_points": ALLOWED_TRIM_POINTS,
        },
    }
