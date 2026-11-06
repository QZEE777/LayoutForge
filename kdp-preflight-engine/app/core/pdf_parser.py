"""
PDF parser: load PDF and extract raw structure and metadata using PyMuPDF (fitz).
No validation logic here — only extraction.
Security: active-content and resource-limit checks run at open time before parsing.
"""
from __future__ import annotations

import structlog
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF

logger = structlog.get_logger(__name__)

# PDF bomb protection: safe processing limits
MAX_PAGES = 1000
MAX_OBJECTS = 200000
MAX_IMAGES = 10000


class ActiveContentError(ValueError):
    """Raised when PDF contains disallowed active or embedded content."""
    pass


class ResourceLimitError(ValueError):
    """Raised when PDF exceeds safe processing limits."""
    pass


def _check_active_content(doc: fitz.Document) -> None:
    """Raise ActiveContentError if document has JavaScript, OpenAction, Launch, or embedded files."""
    if getattr(doc, "has_js", None) and callable(doc.has_js) and doc.has_js():
        doc.close()
        raise ActiveContentError("PDF contains JavaScript which is not allowed")
    if doc.embfile_count() > 0:
        doc.close()
        raise ActiveContentError("PDF contains embedded files which are not allowed")
    try:
        cat_xref = doc.pdf_catalog()
        catalog_str = doc.xref_object(cat_xref) or ""
        if "/OpenAction" in catalog_str:
            doc.close()
            raise ActiveContentError("PDF contains OpenAction which is not allowed")
        if "/Launch" in catalog_str:
            doc.close()
            raise ActiveContentError("PDF contains Launch actions which are not allowed")
        if "/JavaScript" in catalog_str or "/JS " in catalog_str:
            doc.close()
            raise ActiveContentError("PDF contains JavaScript which is not allowed")
    except ActiveContentError:
        raise
    except Exception:
        pass


def _check_resource_limits(doc: fitz.Document) -> None:
    """Raise ResourceLimitError if document exceeds safe limits."""
    if doc.page_count > MAX_PAGES:
        doc.close()
        raise ResourceLimitError("PDF exceeds maximum page count limit")
    if doc.xref_length() > MAX_OBJECTS:
        doc.close()
        raise ResourceLimitError("PDF contains excessive internal objects")
    image_count = 0
    for page in doc:
        image_count += len(page.get_images())
    if image_count > MAX_IMAGES:
        doc.close()
        raise ResourceLimitError("PDF contains excessive embedded images")


# ─────────────────────────────────────────────────────────────────────────────
# KDP ALLOWED TRIM SIZES — full published list (width x height in inches)
# Source: Amazon KDP help pages (all paperback sizes, portrait + landscape)
# ─────────────────────────────────────────────────────────────────────────────
TRIM_SIZE_INCHES = [
    # Standard US paperback
    (5.00, 8.00),
    (5.06, 7.81),
    (5.25, 8.00),
    (5.50, 8.50),
    (6.00, 9.00),
    (6.14, 9.21),
    (6.69, 9.61),
    (7.00, 10.00),
    (7.44, 9.69),
    (7.50, 9.25),
    (8.00, 10.00),
    (8.50, 11.00),
    # Square formats
    (8.25, 8.25),
    (8.50, 8.50),
    # Landscape
    (8.25, 6.00),
    # UK / A-format (expanded distribution)
    (5.83, 8.27),   # A5
    (8.27, 11.69),  # A4
]

POINTS_PER_INCH = 72


def _inches_to_points(w_in: float, h_in: float) -> tuple[float, float]:
    return (w_in * POINTS_PER_INCH, h_in * POINTS_PER_INCH)


# Allowed trim sizes in points — include portrait and landscape orientations
ALLOWED_TRIM_POINTS: set[tuple[float, float]] = set()
for _w, _h in TRIM_SIZE_INCHES:
    _pt = _inches_to_points(_w, _h)
    ALLOWED_TRIM_POINTS.add(_pt)
    ALLOWED_TRIM_POINTS.add((_pt[1], _pt[0]))  # landscape variant


def load_document(path: Path) -> fitz.Document:
    """Open PDF from path. Raises ValueError on encryption or active content."""
    doc = fitz.open(path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("Encrypted PDFs are not supported. Remove the password and try again.")
    _check_active_content(doc)
    _check_resource_limits(doc)
    return doc


def get_pdf_version(doc: fitz.Document) -> float:
    """Return PDF version as float (e.g. 1.4, 1.6)."""
    try:
        ver = doc.metadata.get("format", "PDF-1.4")
        if ver.startswith("PDF-"):
            return float(ver.replace("PDF-", "").strip())
    except (ValueError, TypeError):
        pass
    return 1.4


def get_creator_info(doc: fitz.Document) -> dict[str, str]:
    """Extract creator/producer metadata — used for tool-specific fix instructions."""
    meta = doc.metadata or {}
    return {
        "creator": (meta.get("creator") or "").strip(),
        "producer": (meta.get("producer") or "").strip(),
        "author": (meta.get("author") or "").strip(),
        "title": (meta.get("title") or "").strip(),
    }


def get_page_dimensions(page: fitz.Page) -> tuple[float, float]:
    """Return (width, height) in points for the page rect."""
    rect = page.rect
    return (rect.width, rect.height)


def get_trim_box(page: fitz.Page) -> tuple[float, float, float, float] | None:
    """Return trim box as (x0, y0, x1, y1) in points. Falls back to MediaBox if not set."""
    try:
        trim = getattr(page, "trimbox", None)
        if trim is None and hasattr(page, "get_trimbox"):
            trim = page.get_trimbox()
        if trim and getattr(trim, "is_valid", True):
            return (trim.x0, trim.y0, trim.x1, trim.y1)
    except Exception:
        pass
    r = page.rect
    return (r.x0, r.y0, r.x1, r.y1)


def get_bleed_box(page: fitz.Page) -> tuple[float, float, float, float] | None:
    """Return bleed box if present; else None."""
    try:
        bleed = getattr(page, "bleedbox", None)
        if bleed is None and hasattr(page, "get_bleedbox"):
            bleed = page.get_bleedbox()
        if bleed and getattr(bleed, "is_valid", True):
            return (bleed.x0, bleed.y0, bleed.x1, bleed.y1)
    except Exception:
        pass
    return None


def extract_text_blocks(page: fitz.Page) -> list[dict[str, Any]]:
    """Extract text spans with bbox, size, and font name."""
    blocks = []
    try:
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    bbox = span.get("bbox")
                    if bbox:
                        blocks.append({
                            "bbox": list(bbox),
                            "text": span.get("text", "").strip(),
                            "size": span.get("size"),
                            "font": span.get("font"),
                        })
    except Exception as e:
        logger.warning("text_extract_error", error=str(e))
    return blocks


def get_fonts_with_embedding(doc: fitz.Document, page: fitz.Page) -> list[dict[str, Any]]:
    """
    Return all fonts referenced on this page with real embedding status.

    Uses page.get_fonts(full=True) which returns:
      (xref, ext, type, basefont, name, encoding, referencer)

    The `ext` field is the embedded font file extension ("ttf", "otf", "pfb", etc.)
    or EMPTY STRING if the font is NOT embedded in the PDF.

    Type3 fonts are always considered embedded (they're defined inline).
    xref==0 fonts are inline/synthetic — skip them.
    """
    fonts: list[dict[str, Any]] = []
    seen_xrefs: set[int] = set()

    try:
        for font_tuple in page.get_fonts(full=True):
            xref = font_tuple[0]
            ext = font_tuple[1]       # "" = NOT embedded
            font_type = font_tuple[2] # "TrueType", "Type1", "CIDFontType2", "Type3"
            base_name = font_tuple[3] # PostScript name
            ref_name = font_tuple[4]  # name as referenced in content stream

            if xref == 0 or xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)

            # Type3 fonts are defined inline — always embedded
            is_type3 = bool(font_type and "type3" in font_type.lower())
            # ext="" or "n/a" means the font program is NOT embedded
            is_embedded = is_type3 or bool(ext and ext.lower() not in ("", "n/a"))

            display_name = base_name or ref_name or "Unknown"

            fonts.append({
                "name": display_name,
                "type": font_type or "Unknown",
                "embedded": is_embedded,
                "ext": ext or "",
            })
    except Exception as e:
        logger.warning("font_embedding_check_error", error=str(e))

    return fonts


def extract_images(page: fitz.Page) -> list[dict[str, Any]]:
    """Extract image list with bbox, resolution, and colorspace."""
    images = []
    try:
        for img in page.get_images(full=True):
            try:
                xref = img[0]
                base = page.parent.extract_image(xref)
                w = base.get("width") or 0
                h = base.get("height") or 0
                colorspace = {1: "DeviceGray", 3: "DeviceRGB", 4: "DeviceCMYK"}.get(base.get("colorspace"), "Unknown")
                bits_per_component = base.get("bpc") or 8  # bits per component

                for item in page.get_image_info(xrefs=True):
                    if item.get("xref") == xref:
                        bbox = item.get("bbox")
                        if bbox:
                            bbox_w_pt = bbox[2] - bbox[0]
                            bbox_h_pt = bbox[3] - bbox[1]
                            dpi_x = (w / bbox_w_pt * POINTS_PER_INCH) if bbox_w_pt else 0
                            dpi_y = (h / bbox_h_pt * POINTS_PER_INCH) if bbox_h_pt else 0
                            images.append({
                                "bbox": list(bbox),
                                "width_px": w,
                                "height_px": h,
                                "dpi_x": round(dpi_x, 1),
                                "dpi_y": round(dpi_y, 1),
                                "colorspace": str(colorspace),
                                "bpc": bits_per_component,  # 1 = line art, 8 = photo
                            })
            except Exception as e:
                logger.warning("image_extract_skip", xref=img[0], error=str(e))
    except Exception as e:
        logger.warning("image_list_error", error=str(e))
    return images


def detect_transparency(doc: fitz.Document, page: fitz.Page) -> bool:
    """
    Detect unflattened transparency on a page.

    Strategy:
    1. Check drawing paths for fill_opacity or stroke_opacity < 1
    2. Check page dictionary for /Group key (transparency group)

    Returns True if transparency is detected (should be flagged as ERROR).
    """
    # Strategy 1: drawing paths with non-opaque colors
    try:
        drawings = page.get_drawings()
        for d in (drawings or []):
            fill_op = d.get("fill_opacity")
            stroke_op = d.get("stroke_opacity")
            if fill_op is not None and fill_op < 0.99:
                return True
            if stroke_op is not None and stroke_op < 0.99:
                return True
    except Exception:
        pass

    # Strategy 2: page dictionary /Group key indicates a transparency group
    try:
        page_xref = page.xref
        if page_xref and page_xref > 0:
            page_obj_str = doc.xref_object(page_xref)
            if "/Group" in page_obj_str:
                return True
    except Exception:
        pass

    return False


def detect_interactive_elements(page: fitz.Page) -> int:
    """
    Count interactive elements (form fields/widgets) on a page.
    KDP requires all interactive elements to be flattened.
    Returns count of widget annotations found.
    """
    widget_count = 0
    try:
        for annot in page.annots():
            if annot.type[1] in ("Widget", "Screen", "Movie", "Sound", "FileAttachment"):
                widget_count += 1
    except Exception:
        pass
    return widget_count


def detect_spot_colors(doc: fitz.Document, page: fitz.Page) -> list[str]:
    """
    Detect spot colors (Separation or DeviceN colorspaces) in images on this page.
    Spot colors are not supported by KDP — must be converted to CMYK.
    Returns list of image colorspace names that are spot colors.
    """
    spot_found: list[str] = []
    try:
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                base = doc.extract_image(xref)
                cs = str(base.get("colorspace") or "")
                if "DeviceN" in cs or "Separation" in cs or "ICCBased" in cs:
                    if cs not in spot_found:
                        spot_found.append(cs)
            except Exception:
                pass
    except Exception:
        pass
    return spot_found


# Annotation types that are notes or markup (KDP: no comments or annotations).
# Links and form fields are left out: links are harmless in print, and form
# fields are handled by the interactive-elements rule.
COMMENT_ANNOT_TYPES = frozenset({
    "Text", "FreeText", "Highlight", "Underline", "StrikeOut", "Squiggly",
    "Ink", "Stamp", "Caret", "Line", "Square", "Circle", "Polygon", "PolyLine",
})


def count_comment_annotations(page: fitz.Page) -> int:
    """Count sticky notes, highlights and other markup left on a page."""
    count = 0
    try:
        for annot in page.annots():
            if annot.type[1] in COMMENT_ANNOT_TYPES:
                count += 1
    except Exception:
        pass
    return count


def count_crop_mark_corners(drawings: list[dict[str, Any]], w: float, h: float) -> int:
    """
    Count page corners that carry printer crop marks: a short thin horizontal
    line and a short thin vertical line near the corner that do not touch
    (crop marks leave a gap at the trim corner). Decorative corner frames are
    joined, so they don't count.
    """
    zone = 72.0  # look within 1" of each corner
    corners = {(0, 0): ([], []), (1, 0): ([], []), (0, 1): ([], []), (1, 1): ([], [])}
    for d in drawings or []:
        if (d.get("width") or 0) > 1.0:
            continue
        for item in d.get("items") or []:
            if not item or item[0] != "l":
                continue
            a, b = item[1], item[2]
            dx, dy = abs(a.x - b.x), abs(a.y - b.y)
            horiz, vert = dy < 0.5 <= dx, dx < 0.5 <= dy
            length = max(dx, dy)
            if not (horiz or vert) or not (9.0 <= length <= 54.0):
                continue
            for (cx, cy), (hs, vs) in corners.items():
                x0, y0 = cx * w, cy * h
                if all(abs(pt.x - x0) <= zone and abs(pt.y - y0) <= zone for pt in (a, b)):
                    (hs if horiz else vs).append((a, b))
    marked = 0
    for hs, vs in corners.values():
        if any(not _segments_touch(hseg, vseg) for hseg in hs for vseg in vs):
            marked += 1
    return marked


def _segments_touch(hseg: tuple, vseg: tuple, gap: float = 2.0) -> bool:
    """True if a horizontal and a vertical segment meet or nearly meet."""
    (ha, hb), (va, vb) = hseg, vseg
    hx0, hx1, hy = min(ha.x, hb.x), max(ha.x, hb.x), ha.y
    vy0, vy1, vx = min(va.y, vb.y), max(va.y, vb.y), va.x
    return (hx0 - gap <= vx <= hx1 + gap) and (vy0 - gap <= hy <= vy1 + gap)


IMAGE_PAGE_COVERAGE = 0.8   # one picture covers 80%+ of the page
INK_SCAN_DPI = 50           # 0.02" precision is plenty for 0.25" margins
INK_THRESHOLD = 235         # grey level below this counts as ink (0 black, 255 white)
_INK_TABLE = bytes(1 if v < INK_THRESHOLD else 0 for v in range(256))


def is_image_page(images: list[dict[str, Any]], w: float, h: float) -> bool:
    """True when one picture covers most of the page (Canva exports, scans)."""
    area = w * h
    for img in images:
        b = img.get("bbox")
        if b and len(b) == 4 and area:
            cw = max(0.0, min(b[2], w) - max(b[0], 0.0))
            ch = max(0.0, min(b[3], h) - max(b[1], 0.0))
            if cw * ch >= IMAGE_PAGE_COVERAGE * area:
                return True
    return False


def find_ink_bbox(page: fitz.Page) -> list[float] | None:
    """Bounding box (points) of everything that isn't near-white on the page."""
    try:
        pix = page.get_pixmap(dpi=INK_SCAN_DPI, colorspace=fitz.csGRAY, alpha=False)
    except Exception:
        return None
    rows, cols, stride = pix.height, pix.width, pix.stride
    data = pix.samples
    top = bottom = None
    left, right = cols, -1
    for y in range(rows):
        row = data[y * stride: y * stride + cols].translate(_INK_TABLE)
        first = row.find(1)
        if first < 0:
            continue
        last = row.rfind(1)
        top = y if top is None else top
        bottom = y
        left, right = min(left, first), max(right, last)
    if top is None:
        return None
    sx, sy = page.rect.width / cols, page.rect.height / rows
    return [left * sx, top * sy, (right + 1) * sx, (bottom + 1) * sy]


def get_page_rotation(page: fitz.Page) -> int:
    """Return rotation in degrees (0, 90, 180, 270)."""
    return page.rotation


def parse_pdf(path: Path, scan_ink: bool = True) -> dict[str, Any]:
    """
    Full parse of PDF: metadata, version, creator info, and per-page data.
    Returns a structure suitable for document_analyzer and rules engine.
    """
    doc = load_document(path)
    try:
        version = get_pdf_version(doc)
        page_count = len(doc)
        creator_info = get_creator_info(doc)
        try:
            bookmark_count = len(doc.get_toc(simple=True))
        except Exception:
            bookmark_count = 0
        pages_data: list[dict[str, Any]] = []

        for pno in range(page_count):
            page = doc[pno]
            w, h = get_page_dimensions(page)
            trim_box = get_trim_box(page)
            bleed_box = get_bleed_box(page)
            text_blocks = extract_text_blocks(page)
            images = extract_images(page)
            fonts = get_fonts_with_embedding(doc, page)  # Real embedding detection
            rotation = get_page_rotation(page)
            raw_text_stripped = (page.get_text() or "").strip()
            embedded_image_count = len(page.get_images())
            has_transparency = detect_transparency(doc, page)
            interactive_count = detect_interactive_elements(page)
            spot_colors = detect_spot_colors(doc, page)

            try:
                dw = page.get_drawings()
                drawing_count = len(dw) if dw is not None else 0
            except Exception:
                dw = []
                drawing_count = 0
            comment_count = count_comment_annotations(page)
            image_page = is_image_page(images, w, h)
            # Only needed for No-bleed margin checks; skipping it keeps bleed scans fast.
            ink_bbox = find_ink_bbox(page) if image_page and scan_ink else None
            crop_mark_corners = count_crop_mark_corners(dw or [], w, h)

            pages_data.append({
                "page_number": pno + 1,
                "width": w,
                "height": h,
                "trim_box": trim_box,
                "bleed_box": bleed_box,
                "text_blocks": text_blocks,
                "images": images,
                "fonts": fonts,
                "rotation": rotation,
                "raw_text_stripped": raw_text_stripped,
                "embedded_image_count": embedded_image_count,
                "drawing_count": drawing_count,
                "has_transparency": has_transparency,
                "interactive_count": interactive_count,
                "spot_colors": spot_colors,
                "comment_count": comment_count,
                "crop_mark_corners": crop_mark_corners,
                "image_page": image_page,
                "ink_bbox": ink_bbox,
            })

        return {
            "path": str(path),
            "pdf_version": version,
            "page_count": page_count,
            "creator_info": creator_info,
            "bookmark_count": bookmark_count,
            "pages": pages_data,
        }
    finally:
        doc.close()
