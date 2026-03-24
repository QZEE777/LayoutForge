"""
Font-related KDP rules: embedding (REAL check), minimum size, restricted fonts.
"""
from __future__ import annotations

from typing import Any


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def rule_embedded_fonts(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Rule 14: ALL fonts must be embedded in the PDF.

    Uses the real embedding flag from pdf_parser.get_fonts_with_embedding()
    which reads PyMuPDF's font.ext field:
      - ext == "" or "n/a" → font is NOT embedded (KDP hard rejection)
      - ext == "ttf"/"pfb"/"otf"/etc. → font IS embedded (pass)
      - Type3 fonts → always embedded by definition (pass)

    Severity: ERROR — KDP auto-rejects PDFs with non-embedded fonts.
    """
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    seen_unembedded: set[str] = set()  # report each font name once, not once per page

    for p in pages:
        for font in (p.get("fonts") or []):
            if font.get("embedded", True):  # default True avoids false positives if flag missing
                continue
            name = font.get("name") or "Unknown"
            font_type = font.get("type") or ""

            # De-duplicate: report each unique font name once across the document
            key = f"{name}|{font_type}"
            if key in seen_unembedded:
                continue
            seen_unembedded.add(key)

            issues.append(_issue(
                p.get("page_number", 0),
                "EMBEDDED_FONTS",
                "ERROR",
                (
                    f"Font '{name}' ({font_type}) is NOT embedded in this PDF. "
                    "KDP will automatically reject files with unembedded fonts. "
                    "Re-export your PDF with 'Embed all fonts' enabled."
                ),
                None,
            ))

    return issues


def rule_minimum_font_size(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 15: Minimum font size 7pt (KDP readability requirement)."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for blk in (p.get("text_blocks") or []):
            size = blk.get("size")
            if size is not None and 0 < size < 7.0:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "MIN_FONT_SIZE",
                    "ERROR",
                    f"Font size {size:.1f}pt is below KDP minimum of 7pt.",
                    blk.get("bbox"),
                ))
    return issues


def rule_restricted_font_embedding(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Rule 22: Warn on fonts that commonly have restricted embedding licenses.
    Note: rule_embedded_fonts() catches ALL unembedded fonts with ERROR.
    This rule adds a WARNING for fonts whose embedding flag couldn't be confirmed.
    """
    # Fonts where embedding may be restricted by license (not the 14 standard PDF fonts)
    RESTRICTED_NAMES = frozenset({
        "Arial", "Calibri", "Cambria", "Garamond",
        "Futura", "Gotham", "Proxima Nova",
    })

    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    warned: set[str] = set()

    for p in pages:
        for font in (p.get("fonts") or []):
            name = font.get("name") or ""
            # Only warn if NOT already caught by rule_embedded_fonts as unembedded
            if font.get("embedded", True):
                for restricted in RESTRICTED_NAMES:
                    if restricted.lower() in name.lower() and name not in warned:
                        warned.add(name)
                        issues.append(_issue(
                            p.get("page_number", 0),
                            "RESTRICTED_FONT_EMBEDDING",
                            "WARNING",
                            (
                                f"Font '{name}' has a commercial license — "
                                "confirm your license permits PDF embedding for KDP publishing."
                            ),
                            None,
                        ))
                        break
    return issues
