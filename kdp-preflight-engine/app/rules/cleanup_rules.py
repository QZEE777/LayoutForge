"""
File clean-up rules: things KDP lists under "common points of failure"
(Paperback Submission Guidelines, read 6 Nov 2026): bookmarks, comments and
annotations, crop or trim marks, and PDF-maker logos or watermarks.
Each rule reports once (on the first page found) with a page count, so a
problem on every page reads as one item, not hundreds.
"""
from __future__ import annotations

import re
from typing import Any

# PDF tools that stamp a logo or line of text on free or trial exports.
_TOOLS = (
    r"pdfelement|wondershare|smallpdf|ilovepdf|sejda|pdf24|foxit|nitro\s?pdf|pdfescape|"
    r"docfly|pdffiller|soda\s?pdf|pdf\s?candy|aspose|spire\.pdf|pdf-xchange|convertapi|"
    r"online2pdf|pdf2go|cutepdf|primopdf|icecream\s?pdf|pdfsam|able2extract|nuance\s?pdf"
)
_WATERMARK_PATTERNS = [
    re.compile(rf"\b(created|generated|made|edited|converted|produced)\s+(with|by|using)\s+(the\s+)?({_TOOLS})", re.I),
    re.compile(r"\bevaluation\s+(copy|only|version|warning|mode)\b", re.I),
    re.compile(r"\b(trial|unregistered|demo)\s+version\b", re.I),
    re.compile(r"\bunregistered\s+copy\b", re.I),
    re.compile(r"\b(smallpdf\.com|ilovepdf\.com|sejda\.com|pdf24\.org|pdfescape\.com|docfly\.com|pdffiller\.com|sodapdf\.com|pdfcandy\.com|online2pdf\.com|pdf2go\.com)\b", re.I),
]


def _issue(page: int, rule_id: str, severity: str, message: str) -> dict[str, Any]:
    return {"page": page, "rule_id": rule_id, "severity": severity, "message": message, "bbox": None}


def _pages(doc: dict[str, Any]) -> list[dict[str, Any]]:
    return doc.get("analysis", {}).get("pages") or []


def _where(found: list[int]) -> str:
    return f"page {found[0]}" if len(found) == 1 else f"{len(found)} pages (first on page {found[0]})"


def rule_bookmarks(doc: dict[str, Any]) -> list[dict[str, Any]]:
    count = (doc.get("parsed") or {}).get("bookmark_count") or 0
    if not count:
        return []
    return [_issue(1, "PDF_BOOKMARKS", "WARNING",
                   f"Your PDF has {count} bookmark{'s' if count != 1 else ''}. KDP asks for files without bookmarks. "
                   "Turn off 'Create bookmarks' when you export, or remove them in your PDF reader.")]


def rule_comments(doc: dict[str, Any]) -> list[dict[str, Any]]:
    found = [p.get("page_number", 0) for p in _pages(doc) if (p.get("comment_count") or 0) > 0]
    if not found:
        return []
    return [_issue(found[0], "PDF_COMMENTS", "WARNING",
                   f"Comments, highlights or sticky notes are left on {_where(found)}. KDP asks for files without comments "
                   "or annotations. Delete them, or export again with comments switched off.")]


def rule_crop_marks(doc: dict[str, Any]) -> list[dict[str, Any]]:
    found = [p.get("page_number", 0) for p in _pages(doc) if (p.get("crop_mark_corners") or 0) >= 3]
    if not found:
        return []
    return [_issue(found[0], "CROP_MARKS", "WARNING",
                   f"Printer crop marks found on {_where(found)}. KDP asks for files without crop or cut marks. "
                   "Export again with 'Crop marks' and 'Printer marks' switched off.")]


def rule_pdf_watermark(doc: dict[str, Any]) -> list[dict[str, Any]]:
    found: list[int] = []
    sample = ""
    for p in _pages(doc):
        text = p.get("raw_text_stripped") or ""
        for pat in _WATERMARK_PATTERNS:
            m = pat.search(text)
            if m:
                found.append(p.get("page_number", 0))
                sample = sample or m.group(0)
                break
    if not found:
        return []
    return [_issue(found[0], "PDF_WATERMARK", "ERROR",
                   f"A PDF tool's watermark (\"{sample}\") is printed on {_where(found)}. It will print in your book, "
                   "and KDP lists PDF-maker logos as a common reason files fail. Export again with a tool that adds no watermark.")]


_PLACEHOLDER_PATTERNS = [
    re.compile(r"\blorem ipsum\b", re.I),
    re.compile(r"\b(insert|add|type|enter|put)\s+(your\s+)?(own\s+)?(text|title|heading|subtitle|name|author name|book title|caption|image|photo|picture|content|chapter title)\s+here\b", re.I),
    re.compile(r"\b(your|sample)\s+(text|title|heading)\s+here\b", re.I),
    re.compile(r"\bclick\s+(here\s+)?to\s+(add|edit|enter)\s+(text|title|a heading)\b", re.I),
    re.compile(r"\bplaceholder\s+text\b", re.I),
]


def rule_placeholder_text(doc: dict[str, Any]) -> list[dict[str, Any]]:
    found: list[int] = []
    sample = ""
    for pg in _pages(doc):
        text = pg.get("raw_text_stripped") or ""
        for pat in _PLACEHOLDER_PATTERNS:
            m = pat.search(text)
            if m:
                found.append(pg.get("page_number", 0))
                sample = sample or m.group(0)
                break
    if not found:
        return []
    return [_issue(found[0], "PLACEHOLDER_TEXT", "WARNING",
                   f"Template placeholder text (\"{sample}\") is still on {_where(found)}. KDP rejects files with "
                   "placeholder text. Replace or delete it before uploading.")]


def rule_thin_lines(doc: dict[str, Any]) -> list[dict[str, Any]]:
    found = [pg.get("page_number", 0) for pg in _pages(doc) if (pg.get("thin_line_count") or 0) > 0]
    if not found:
        return []
    return [_issue(found[0], "LINE_WEIGHT", "WARNING",
                   f"Lines thinner than 0.75 pt are on {_where(found)} (tables, charts, borders or rules). "
                   "KDP recommends at least 0.75 pt, or they may print faintly or break up. Make them thicker if they matter.")]


def rule_light_grey_fills(doc: dict[str, Any]) -> list[dict[str, Any]]:
    if doc.get("analysis", {}).get("print_options", {}).get("color_mode") != "bw":
        return []
    hits = [(pg.get("page_number", 0), pg.get("light_fill_tint")) for pg in _pages(doc) if pg.get("light_fill_tint")]
    if not hits:
        return []
    found = [n for n, _ in hits]
    lightest = min(t for _, t in hits)
    return [_issue(found[0], "LIGHT_GREY_FILL", "WARNING",
                   f"Very light grey backgrounds (as light as {lightest * 100:.0f}%) are on {_where(found)}. In black ink, "
                   "KDP recommends grey fills of at least 10%, or they may not show in print.")]
