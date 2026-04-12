"""
Default bounding boxes for page_issues when rules omit geometry.

Output is always [x, y, width, height] in PDF points. Only fills missing or
unusable boxes; never replaces a usable bbox from the rules engine.

Registered rule_ids (``app.rules.ALL_RULES``) — typical bbox source:
- **Often real content bbox** (when rule finds a block/image): GUTTER_MARGIN,
  OUTSIDE/TOP/BOTTOM margin rules, TEXT_OUTSIDE_TRIM, SAFE_ZONE, IMAGE_*,
  many trim checks when tied to a region.
- **Often null before enrichment**: document-level rules (page counts, PDF
  version, transparency, interactive, odd page count, some trim/profile
  mismatches without a single box). Those receive conservative defaults here.

Single enrichment entry points: ``validation_report.build_report`` (validation
pipeline) and ``annotate_pdf.annotate_pdf_inline`` (uses PDF path geometry so
POST /annotate stays correct even if the client omitted boxes).
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import Any

MIN_STRIP_PT = 20.0
CONTENT_INSET_PT = 36.0
BLEED_MIN_PT = 9.0  # 0.125" at 72 pt/in


def build_page_geometry_from_analysis(doc: dict[str, Any]) -> dict[int, dict[str, Any]]:
    """Build per-page geometry from analyze_document() output."""
    out: dict[int, dict[str, Any]] = {}
    for p in doc.get("analysis", {}).get("pages") or []:
        try:
            pn = int(p.get("page_number") or 0)
        except (TypeError, ValueError):
            continue
        if pn < 1:
            continue
        w = float(p.get("width") or 0)
        h = float(p.get("height") or 0)
        if w <= 0 or h <= 0:
            continue
        trim = p.get("trim_rect") or p.get("trim_box")
        if trim and len(trim) == 4:
            tr = (float(trim[0]), float(trim[1]), float(trim[2]), float(trim[3]))
        else:
            tr = (0.0, 0.0, w, h)
        tw = max(2.0, tr[2] - tr[0])
        th = max(2.0, tr[3] - tr[1])
        bleed_pt = float(p.get("bleed_pt") or BLEED_MIN_PT)
        out[pn] = {
            "media_w": w,
            "media_h": h,
            "trim_rect": tr,
            "trim_w": tw,
            "trim_h": th,
            "safe_left": p.get("safe_left"),
            "safe_right": p.get("safe_right"),
            "safe_top": p.get("safe_top"),
            "safe_bottom": p.get("safe_bottom"),
            "bleed_pt": max(bleed_pt, BLEED_MIN_PT),
            "gutter_pt": p.get("gutter_pt"),
        }
    return out


def build_page_geometry_from_pdf_path(path: Path) -> dict[int, dict[str, Any]]:
    """Build per-page geometry from a PDF on disk (for annotate without full doc analysis)."""
    import fitz

    out: dict[int, dict[str, Any]] = {}
    doc = fitz.open(str(path))
    try:
        for i in range(len(doc)):
            page = doc[i]
            rect = page.rect
            w, h = float(rect.width), float(rect.height)
            if w <= 0 or h <= 0:
                continue
            try:
                tb = page.trimbox
                if tb and tb.is_valid:
                    tr = (float(tb.x0), float(tb.y0), float(tb.x1), float(tb.y1))
                else:
                    tr = (float(rect.x0), float(rect.y0), float(rect.x1), float(rect.y1))
            except Exception:
                tr = (float(rect.x0), float(rect.y0), float(rect.x1), float(rect.y1))
            tw = max(2.0, tr[2] - tr[0])
            th = max(2.0, tr[3] - tr[1])
            out[i + 1] = {
                "media_w": w,
                "media_h": h,
                "trim_rect": tr,
                "trim_w": tw,
                "trim_h": th,
                "safe_left": None,
                "safe_right": None,
                "safe_top": None,
                "safe_bottom": None,
                "bleed_pt": BLEED_MIN_PT,
                "gutter_pt": None,
            }
    finally:
        doc.close()
    return out


def _geom_for_page(page_geometry: dict[int, dict[str, Any]], page_num: int) -> dict[str, Any]:
    if page_num in page_geometry:
        return page_geometry[page_num]
    if 1 in page_geometry:
        return page_geometry[1]
    return {
        "media_w": 612.0,
        "media_h": 792.0,
        "trim_rect": (0.0, 0.0, 612.0, 792.0),
        "trim_w": 612.0,
        "trim_h": 792.0,
        "safe_left": None,
        "safe_right": None,
        "safe_top": None,
        "safe_bottom": None,
        "bleed_pt": BLEED_MIN_PT,
        "gutter_pt": None,
    }


def _bbox_usable(bbox: list[float] | None) -> bool:
    if not bbox or len(bbox) < 4:
        return False
    try:
        x, y, w, h = (float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3]))
    except (TypeError, ValueError):
        return False
    if not all(math.isfinite(v) for v in (x, y, w, h)):
        return False
    return w >= 2.0 and h >= 2.0


def _default_bbox_for_rule(rule_id: str, geom: dict[str, Any]) -> list[float]:
    rid = str(rule_id or "").lower().replace("-", "_")
    tx0, ty0, tx1, ty1 = geom["trim_rect"]
    tw, th = geom["trim_w"], geom["trim_h"]
    mw, mh = geom["media_w"], geom["media_h"]
    bleed = float(geom.get("bleed_pt") or BLEED_MIN_PT)

    # 1 — Bleed (includes IMAGE_BLEED etc.)
    if "bleed" in rid:
        band = min(max(bleed, BLEED_MIN_PT), mh)
        return [0.0, 0.0, min(mw, max(2.0, tw + 2 * band)), max(2.0, band)]

    # 2 — Trim / page size family
    if any(
        k in rid
        for k in (
            "trim",
            "page_size",
            "consistent_trim",
            "allowed_trim",
            "mixed_page",
            "kdp_trim",
            "trim_box",
            "orientation",
            "rotated",
        )
    ):
        return [tx0, ty0, max(2.0, tw), max(2.0, th)]

    # 3 — Gutter (inside binding strip)
    if "gutter" in rid:
        gw = max(MIN_STRIP_PT, float(geom.get("gutter_pt") or MIN_STRIP_PT))
        return [tx0, ty0, min(gw, tw), th]

    # 4 — Named margin edges
    if "top_margin" in rid:
        st = geom.get("safe_top")
        band = max(MIN_STRIP_PT, float(st) - ty0) if st is not None else MIN_STRIP_PT
        return [tx0, ty0, tw, min(band, th)]
    if "bottom_margin" in rid or ("bottom" in rid and "margin" in rid):
        sb = geom.get("safe_bottom")
        band = max(MIN_STRIP_PT, ty1 - float(sb)) if sb is not None else MIN_STRIP_PT
        band = min(band, th)
        return [tx0, max(ty0, ty1 - band), tw, max(2.0, band)]
    if "outside_margin" in rid or ("outside" in rid and "margin" in rid):
        sr = geom.get("safe_right")
        band = max(MIN_STRIP_PT, tx1 - float(sr)) if sr is not None else MIN_STRIP_PT
        band = min(band, tw)
        return [max(tx0, tx1 - band), ty0, max(2.0, band), th]

    # 5 — Generic margin / safe zone / trim text
    if "margin" in rid or "safe_zone" in rid or "text_outside_trim" in rid:
        sl, sr, st, sb = (
            geom.get("safe_left"),
            geom.get("safe_right"),
            geom.get("safe_top"),
            geom.get("safe_bottom"),
        )
        if sl is not None and sr is not None and st is not None and sb is not None:
            rw = max(2.0, float(sr) - float(sl))
            rh = max(2.0, float(sb) - float(st))
            return [float(sl), float(st), rw, rh]
        inset = CONTENT_INSET_PT
        return [
            tx0 + inset,
            ty0 + inset,
            max(2.0, tw - 2 * inset),
            max(2.0, th - 2 * inset),
        ]

    # 6 — Font / image / dpi family
    if any(
        k in rid
        for k in (
            "font",
            "image",
            "dpi",
            "resolution",
            "embedded",
            "color_mode",
            "placement",
            "interactive",
            "transparency",
        )
    ):
        inset = CONTENT_INSET_PT
        return [
            tx0 + inset,
            ty0 + inset,
            max(2.0, tw - 2 * inset),
            max(2.0, th - 2 * inset),
        ]

    # 7 — Fallback: content inset (document-level issues still get a visible region)
    inset = CONTENT_INSET_PT
    return [
        tx0 + inset,
        ty0 + inset,
        max(2.0, tw - 2 * inset),
        max(2.0, th - 2 * inset),
    ]


def ensure_issue_bboxes(
    page_issues: list[dict[str, Any]],
    page_geometry: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Return a new list of issue dicts. Only issues with missing or unusable bbox
    receive a synthesized [x, y, width, height]; usable bboxes are preserved.
    """
    out: list[dict[str, Any]] = []
    for raw in page_issues:
        issue = dict(raw)
        bbox = issue.get("bbox")
        if _bbox_usable(bbox if isinstance(bbox, list) else None):
            out.append(issue)
            continue
        try:
            pn = int(issue.get("page") or 1)
        except (TypeError, ValueError):
            pn = 1
        if pn < 1:
            pn = 1
        geom = _geom_for_page(page_geometry, pn)
        issue["bbox"] = _default_bbox_for_rule(str(issue.get("rule_id", "")), geom)
        out.append(issue)
    return out
