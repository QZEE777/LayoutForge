"""Image-related KDP rules: bleed, resolution, color mode, placement."""
from __future__ import annotations

from typing import Any

from app.core.pdf_parser import POINTS_PER_INCH

MIN_DPI = 300
BLEED_EXTRA_PT = 0.125 * POINTS_PER_INCH


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def rule_image_bleed(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 11: Images crossing trim must extend to bleed edge."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_rect") or p.get("trim_box")
        if not trim or len(trim) != 4:
            continue
        t_x0, t_y0, t_x1, t_y1 = trim
        for img in p.get("images") or []:
            bbox = img.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            # If image touches trim, it should extend to bleed (trim ± 0.125")
            # Simplified: if image crosses trim and doesn't extend to bleed, warn.
            i_x0, i_y0, i_x1, i_y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            touches_left = i_x0 < t_x0 + 2
            touches_right = i_x1 > t_x1 - 2
            touches_top = i_y0 < t_y0 + 2
            touches_bottom = i_y1 > t_y1 - 2
            if touches_left or touches_right or touches_top or touches_bottom:
                bleed_left = t_x0 - BLEED_EXTRA_PT
                bleed_right = t_x1 + BLEED_EXTRA_PT
                bleed_top = t_y0 - BLEED_EXTRA_PT
                bleed_bottom = t_y1 + BLEED_EXTRA_PT
                if (touches_left and i_x0 > bleed_left + 2) or (touches_right and i_x1 < bleed_right - 2) or \
                   (touches_top and i_y0 > bleed_top + 2) or (touches_bottom and i_y1 < bleed_bottom - 2):
                    issues.append(_issue(
                        p.get("page_number", 0),
                        "IMAGE_BLEED",
                        "WARNING",
                        "Image crosses trim but does not extend to bleed edge (0.125\").",
                        bbox,
                    ))
    return issues


def rule_image_resolution(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 12: All images at least 300 DPI."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for img in p.get("images") or []:
            dpi_x = img.get("dpi_x") or 0
            dpi_y = img.get("dpi_y") or 0
            if dpi_x < MIN_DPI or dpi_y < MIN_DPI:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_RESOLUTION",
                    "ERROR",
                    f"Image resolution ({dpi_x:.0f}x{dpi_y:.0f} DPI) is below 300 DPI.",
                    img.get("bbox"),
                ))
    return issues


def rule_image_color_mode(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 13: Accept RGB or Grayscale."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    allowed = {"DeviceRGB", "RGB", "DeviceGray", "Gray", "G", "RG"}
    for p in pages:
        for img in p.get("images") or []:
            cs = img.get("colorspace")
            if cs is not None and str(cs).strip() and str(cs) not in allowed and "Gray" not in str(cs) and "RGB" not in str(cs):
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_COLOR_MODE",
                    "WARNING",
                    f"Image color mode '{cs}' may not be RGB or Grayscale.",
                    img.get("bbox"),
                ))
    return issues


def rule_image_placement(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 20: Images must not violate margin zones."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        sl, sr, st, sb = p.get("safe_left"), p.get("safe_right"), p.get("safe_top"), p.get("safe_bottom")
        if None in (sl, sr, st, sb):
            continue
        for img in p.get("images") or []:
            bbox = img.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0, y0, x1, y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            if x0 < sl - 1 or x1 > sr + 1 or y0 < st - 1 or y1 > sb + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_PLACEMENT",
                    "ERROR",
                    "Image extends into margin zone.",
                    bbox,
                ))
    return issues
