"""
Image-related KDP rules: resolution (photos + line art), color mode,
spot color detection, bleed, placement.
"""
from __future__ import annotations

from typing import Any

from app.core.pdf_parser import POINTS_PER_INCH

MIN_DPI_PHOTO    = 300    # photos and grayscale images
MIN_DPI_LINE_ART = 1200   # 1-bit black & white line art (KDP spec)
BLEED_EXTRA_PT   = 0.125 * POINTS_PER_INCH


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def _is_line_art(img: dict[str, Any]) -> bool:
    """1-bit (bilevel) images are line art — require 1200 DPI per KDP spec."""
    return int(img.get("bpc") or 8) == 1


def rule_image_bleed(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 11: Images crossing trim must extend to bleed edge (0.125\")."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        trim = p.get("trim_rect") or p.get("trim_box")
        if not trim or len(trim) != 4:
            continue
        t_x0, t_y0, t_x1, t_y1 = trim
        for img in (p.get("images") or []):
            bbox = img.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            i_x0, i_y0, i_x1, i_y1 = bbox[0], bbox[1], bbox[2], bbox[3]
            touches_left   = i_x0 < t_x0 + 2
            touches_right  = i_x1 > t_x1 - 2
            touches_top    = i_y0 < t_y0 + 2
            touches_bottom = i_y1 > t_y1 - 2

            if touches_left or touches_right or touches_top or touches_bottom:
                bleed_l = t_x0 - BLEED_EXTRA_PT
                bleed_r = t_x1 + BLEED_EXTRA_PT
                bleed_t = t_y0 - BLEED_EXTRA_PT
                bleed_b = t_y1 + BLEED_EXTRA_PT

                short = (
                    (touches_left   and i_x0 > bleed_l + 2) or
                    (touches_right  and i_x1 < bleed_r - 2) or
                    (touches_top    and i_y0 > bleed_t + 2) or
                    (touches_bottom and i_y1 < bleed_b - 2)
                )
                if short:
                    issues.append(_issue(
                        p.get("page_number", 0),
                        "IMAGE_BLEED",
                        "ERROR",
                        "An image reaches the trim edge but does not extend 0.125\" into the bleed area. "
                        "This image will show a white gap at the edge after trimming. "
                        "Extend the image beyond the trim by 0.125\" on all edges that bleed.",
                        bbox,
                    ))
    return issues


def rule_image_resolution(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Rule 12: Image resolution requirements.
    - Photos/grayscale: minimum 300 DPI
    - Line art (1-bit): minimum 1200 DPI (KDP requirement for sharp text/artwork)
    DPI is calculated from the image's pixel dimensions vs its placed size on the page.
    """
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for img in (p.get("images") or []):
            dpi_x = img.get("dpi_x") or 0
            dpi_y = img.get("dpi_y") or 0
            if dpi_x == 0 and dpi_y == 0:
                continue  # No DPI data — skip rather than false-positive

            is_la = _is_line_art(img)
            required = MIN_DPI_LINE_ART if is_la else MIN_DPI_PHOTO

            if dpi_x < required or dpi_y < required:
                kind = "line art (1-bit)" if is_la else "photo/image"
                req_label = f"{required} DPI"
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_RESOLUTION",
                    "ERROR",
                    f"A {kind} on page {p.get('page_number')} is {dpi_x:.0f}×{dpi_y:.0f} DPI "
                    f"but KDP requires {req_label} minimum. "
                    "Low-resolution images will appear pixelated or blurry in print.",
                    img.get("bbox"),
                ))
    return issues


def rule_image_color_mode(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Rule 13: Detect problematic color spaces.
    - Spot colors (Separation, DeviceN): ERROR — not supported by KDP
    - CMYK images: WARNING — KDP accepts but converts; color shift may occur
    - ICCBased: Warning — verify color profile is compatible
    """
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    reported_spot: set[str] = set()

    for p in pages:
        # Check image colorspaces
        for img in (p.get("images") or []):
            cs = str(img.get("colorspace") or "")
            pn = p.get("page_number", 0)

            if "DeviceN" in cs or "Separation" in cs:
                if cs not in reported_spot:
                    reported_spot.add(cs)
                    issues.append(_issue(
                        pn,
                        "IMAGE_COLOR_MODE",
                        "ERROR",
                        f"Spot color ({cs}) detected. KDP does not support spot colors — "
                        "convert all spot colors to CMYK or RGB before uploading.",
                        img.get("bbox"),
                    ))
            elif "CMYK" in cs or "DeviceCMYK" in cs:
                issues.append(_issue(
                    pn,
                    "IMAGE_COLOR_MODE",
                    "WARNING",
                    "CMYK image detected. KDP accepts CMYK but performs its own color conversion — "
                    "colors may shift in print. For predictable results, use the SWOP v2 color profile.",
                    img.get("bbox"),
                ))

        # Check page-level spot colors detected by pdf_parser
        for cs in (p.get("spot_colors") or []):
            if cs not in reported_spot and ("DeviceN" in cs or "Separation" in cs):
                reported_spot.add(cs)
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_COLOR_MODE",
                    "ERROR",
                    f"Spot color ({cs}) detected in page resources. "
                    "Convert all spot colors to CMYK process colors.",
                    None,
                ))

    return issues


def rule_image_placement(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 20: Images must not intrude into margin zones (unless intentional bleed art)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or []
    for p in pages:
        sl, sr, st, sb = p.get("safe_left"), p.get("safe_right"), p.get("safe_top"), p.get("safe_bottom")
        if None in (sl, sr, st, sb):
            continue
        for img in (p.get("images") or []):
            bbox = img.get("bbox")
            if not bbox or len(bbox) < 4:
                continue
            x0, y0, x1, y1 = bbox
            # An image that fully spans the page (full bleed) is intentional — don't flag
            w = p.get("width", 0)
            h = p.get("height", 0)
            is_full_bleed = (x0 <= 2 and y0 <= 2 and x1 >= w - 2 and y1 >= h - 2)
            if is_full_bleed:
                continue
            if x0 < sl - 1 or x1 > sr + 1 or y0 < st - 1 or y1 > sb + 1:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "IMAGE_PLACEMENT",
                    "WARNING",
                    "An image extends into the margin zone. "
                    "Content inside margins may be cut off during printing and binding.",
                    bbox,
                ))
    return issues
