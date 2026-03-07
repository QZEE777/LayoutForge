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
    """Raised when PDF contains disallowed active or embedded content (JS, OpenAction, Launch, embedded files)."""
    pass


def _check_active_content(doc: fitz.Document) -> None:
    """Raise ActiveContentError if document has JavaScript, OpenAction, Launch actions, or embedded files."""
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
        pass  # if catalog access fails, continue without failing on active content


class ResourceLimitError(ValueError):
    """Raised when PDF exceeds safe processing limits (pages, objects, or images)."""
    pass


def _check_resource_limits(doc: fitz.Document) -> None:
    """Raise ResourceLimitError if document exceeds MAX_PAGES, MAX_OBJECTS, or MAX_IMAGES."""
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


# KDP allowed trim sizes (width x height in inches). Order: width <= height.
TRIM_SIZE_INCHES = [
    (5, 8),
    (5.25, 8),
    (5.5, 8.5),
    (6, 9),
    (7, 10),
    (8.5, 11),
]
POINTS_PER_INCH = 72


def _inches_to_points(w_in: float, h_in: float) -> tuple[float, float]:
    return (w_in * POINTS_PER_INCH, h_in * POINTS_PER_INCH)


# Allowed trim sizes in points (width, height) — normal and rotated
ALLOWED_TRIM_POINTS: set[tuple[float, float]] = set()
for w, h in TRIM_SIZE_INCHES:
    pt = _inches_to_points(w, h)
    ALLOWED_TRIM_POINTS.add(pt)
    ALLOWED_TRIM_POINTS.add((pt[1], pt[0]))  # portrait vs landscape


def load_document(path: Path) -> fitz.Document:
    """Open PDF from path. Caller must ensure path exists and is a valid PDF."""
    doc = fitz.open(path)
    if doc.is_encrypted:
        doc.close()
        raise ValueError("Encrypted PDFs are not supported")
    _check_active_content(doc)
    _check_resource_limits(doc)
    return doc


def get_pdf_version(doc: fitz.Document) -> float:
    """Return PDF version as float (e.g. 1.4, 1.6)."""
    # PyMuPDF: metadata may not expose version directly; check xref
    try:
        ver = doc.metadata.get("format", "PDF-1.4")
        if ver.startswith("PDF-"):
            return float(ver.replace("PDF-", "").strip())
    except (ValueError, TypeError):
        pass
    return 1.4  # assume minimum if unknown


def get_page_dimensions(page: fitz.Page) -> tuple[float, float]:
    """Return (width, height) in points for the page rect."""
    rect = page.rect
    return (rect.width, rect.height)


def get_trim_box(page: fitz.Page) -> tuple[float, float, float, float] | None:
    """Return trim box as (x0, y0, x1, y1) in points. Fallback to MediaBox (page.rect) if not set."""
    try:
        if hasattr(page, "get_trimbox"):
            trim = page.get_trimbox()
            if trim and getattr(trim, "is_valid", True):
                return (trim.x0, trim.y0, trim.x1, trim.y1)
    except Exception:
        pass
    # Fallback: use page rect (MediaBox)
    r = page.rect
    return (r.x0, r.y0, r.x1, r.y1)


def get_bleed_box(page: fitz.Page) -> tuple[float, float, float, float] | None:
    """Return bleed box if present; else None (no bleed)."""
    try:
        if hasattr(page, "get_bleedbox"):
            bleed = page.get_bleedbox()
            if bleed and getattr(bleed, "is_valid", True):
                return (bleed.x0, bleed.y0, bleed.x1, bleed.y1)
    except Exception:
        pass
    return None


def extract_text_blocks(page: fitz.Page) -> list[dict[str, Any]]:
    """Extract text blocks with bbox. Each block: { 'bbox': [x0,y0,x1,y1], 'text': str }. """
    blocks = []
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
    return blocks


def extract_images(page: fitz.Page) -> list[dict[str, Any]]:
    """Extract image list with bbox and resolution. """
    images = []
    for img in page.get_images():
        try:
            xref = img[0]
            base = page.parent.extract_image(xref)
            w = base.get("width") or 0
            h = base.get("height") or 0
            # Find placement (bbox) from page images
            for item in page.get_image_info():
                if item.get("xref") == xref:
                    bbox = item.get("bbox")
                    if bbox:
                        # DPI: image size in pixels vs bbox size in points
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
                            "colorspace": base.get("colorspace"),
                        })
                    break
        except Exception as e:
            logger.warning("image_extract_skip", xref=xref, error=str(e))
    return images


def get_fonts_used(page: fitz.Page) -> list[dict[str, Any]]:
    """Collect font names and embedding flags from page."""
    fonts: list[dict[str, Any]] = []
    seen: set[str] = set()
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                name = span.get("font") or "unknown"
                if name not in seen:
                    seen.add(name)
                    # PyMuPDF doesn't always expose embedding; we'll treat as check in rules
                    fonts.append({
                        "name": name,
                        "size": span.get("size"),
                    })
    return fonts


def get_page_rotation(page: fitz.Page) -> int:
    """Return rotation in degrees (0, 90, 180, 270)."""
    return page.rotation


def parse_pdf(path: Path) -> dict[str, Any]:
    """
    Full parse of PDF: metadata, version, and per-page data.
    Returns a structure suitable for document_analyzer and rules engine.
    """
    doc = load_document(path)
    try:
        version = get_pdf_version(doc)
        page_count = len(doc)
        pages_data: list[dict[str, Any]] = []

        for pno in range(page_count):
            page = doc[pno]
            w, h = get_page_dimensions(page)
            trim_box = get_trim_box(page)
            bleed_box = get_bleed_box(page)
            text_blocks = extract_text_blocks(page)
            images = extract_images(page)
            fonts = get_fonts_used(page)
            rotation = get_page_rotation(page)

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
            })

        return {
            "path": str(path),
            "pdf_version": version,
            "page_count": page_count,
            "pages": pages_data,
        }
    finally:
        doc.close()
