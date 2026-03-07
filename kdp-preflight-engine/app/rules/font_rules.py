"""Font-related KDP rules: embedding, minimum size, restricted embedding."""
from __future__ import annotations

from typing import Any

# Fonts that commonly have restricted embedding (simplified list; full list is in PDF spec)
RESTRICTED_EMBEDDING_NAMES = frozenset(
    {"Arial", "Times", "Times New Roman", "Courier", "Helvetica"}
    # In practice we'd check font embedding flags from PDF; PyMuPDF doesn't always expose.
    # This is a conservative check: if we see these and can't confirm embedded, warn.
)


def _issue(page: int, rule_id: str, severity: str, message: str, bbox: list[float] | None = None) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": bbox}


def rule_embedded_fonts(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 14: All fonts must be embedded. PyMuPDF doesn't always expose embedding flag; we report based on available info."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for span in (p.get("fonts") or []):
            # If we had embedding info we'd check it. MVP: assume embedded if PDF was produced by typical tools.
            pass
    # Optional: add a single document-level warning if we detect unembedded fonts (would need deeper PDF API).
    return issues


def rule_minimum_font_size(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 15: Minimum font size 7pt."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for blk in p.get("text_blocks") or []:
            size = blk.get("size")
            if size is not None and size < 7.0:
                issues.append(_issue(
                    p.get("page_number", 0),
                    "MIN_FONT_SIZE",
                    "ERROR",
                    f"Font size {size}pt is below KDP minimum of 7pt.",
                    blk.get("bbox"),
                ))
    return issues


def rule_restricted_font_embedding(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Rule 22: Reject fonts flagged as restricted embedding. We can't always detect; warn on common restricted names."""
    issues = []
    pages = doc.get("analysis", {}).get("pages") or doc.get("parsed", {}).get("pages") or []
    for p in pages:
        for font_info in (p.get("fonts") or []):
            name = (font_info.get("name") or "").lower()
            for restricted in RESTRICTED_EMBEDDING_NAMES:
                if restricted.lower() in name:
                    issues.append(_issue(
                        p.get("page_number", 0),
                        "RESTRICTED_FONT_EMBEDDING",
                        "WARNING",
                        f"Font '{font_info.get('name')}' may have restricted embedding; ensure it is embedded for KDP.",
                        None,
                    ))
                    break
    return issues
