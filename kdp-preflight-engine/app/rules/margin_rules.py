"""Margin and safe-zone KDP rules."""
from __future__ import annotations

from typing import Any


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def rule_gutter_margin(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 6: Inside gutter margin by page count (0.375\"–0.75\")."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_rect") or p.get("trim_box")
        if not trim or len(trim) != 4:
            continue
        safe_left = p.get("safe_left")
        gutter_pt = p.get("gutter_pt")
        if safe_left is None or gutter_pt is None:
            continue
        # Check text blocks crossing into gutter
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0 = bbox[0]
            if x0 < safe_left - 1:  # 1pt tolerance
                issues.append(_issue(
                    p.get("page_number", 0),
                    "GUTTER_MARGIN",
                    "ERROR",
                    "Text inside gutter margin.",
                    bbox,
                ))
                break
    return issues


def rule_outside_margin_min(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 7: Outside margin minimum 0.25\"."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        safe_right = p.get("safe_right")
        if safe_right is None:
            continue
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            if bbox[2] > safe_right + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "OUTSIDE_MARGIN_MIN",
                    "ERROR",
                    "Content extends past outside margin (0.25\" minimum).",
                    bbox,
                ))
                break
    return issues


def rule_top_margin_min(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 8: Top margin minimum 0.25\"."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        safe_top = p.get("safe_top")
        if safe_top is None:
            continue
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            if bbox[1] < safe_top - 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "TOP_MARGIN_MIN",
                    "ERROR",
                    "Content extends above top margin (0.25\" minimum).",
                    bbox,
                ))
                break
    return issues


def rule_bottom_margin_min(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 9: Bottom margin minimum 0.25\"."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        safe_bottom = p.get("safe_bottom")
        if safe_bottom is None:
            continue
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            if bbox[3] > safe_bottom + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "BOTTOM_MARGIN_MIN",
                    "ERROR",
                    "Content extends below bottom margin (0.25\" minimum).",
                    bbox,
                ))
                break
    return issues


def rule_text_outside_trim(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 10: Text must not cross trim boundary."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_rect") or p.get("trim_box")
        if not trim or len(trim) != 4:
            continue
        t_x0, t_y0, t_x1, t_y1 = trim
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            if x0 < t_x0 - 1 or y0 < t_y0 - 1 or x1 > t_x1 + 1 or y1 > t_y1 + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "TEXT_OUTSIDE_TRIM",
                    "ERROR",
                    "Text crosses trim boundary.",
                    bbox,
                ))
    return issues


def rule_safe_zone_validation(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 25: Text and images must remain inside safe margins."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        sl, sr, st, sb = p.get("safe_left"), p.get("safe_right"), p.get("safe_top"), p.get("safe_bottom")
        if None in (sl, sr, st, sb):
            continue
        for blk in p.get("text_blocks") or []:
            bbox = blk.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            if x0 < sl - 1 or x1 > sr + 1 or y0 < st - 1 or y1 > sb + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "SAFE_ZONE",
                    "ERROR",
                    "Text outside safe zone (margins).",
                    bbox,
                ))
        for img in p.get("images") or []:
            bbox = img.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            if x0 < sl - 1 or x1 > sr + 1 or y0 < st - 1 or y1 > sb + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "SAFE_ZONE",
                    "ERROR",
                    "Image outside safe zone (margins).",
                    bbox,
                ))
    return issues
