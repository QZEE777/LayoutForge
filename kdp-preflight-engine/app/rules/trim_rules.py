"""KDP trim profile rule: validate trim size against allowed KDP trim list."""
from __future__ import annotations

from math import sqrt
from typing import Any

# Allowed KDP trims (width x height in inches)
ALLOWED_KDP_TRIMS = [
    (5, 8),
    (5.5, 8.5),
    (6, 9),
    (6.14, 9.21),
    (7, 10),
    (8, 10),
]


def rule_kdp_trim_profile(doc: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Validate that PDF trim size matches one of the allowed KDP trims.
    doc: output of document_analyzer.analyze_document() (includes analysis.trim_width_in, trim_height_in).
    Returns list of dicts with keys: page, rule_id, severity, message, bbox.
    """
    results: list[dict[str, Any]] = []
    analysis = doc.get("analysis") or {}
    width = analysis.get("trim_width_in", 0.0)
    height = analysis.get("trim_height_in", 0.0)
    match = False
    for w, h in ALLOWED_KDP_TRIMS:
        if abs(width - w) < 0.01 and abs(height - h) < 0.01:
            match = True
            break
    if not match:
        closest_trim = min(
            ALLOWED_KDP_TRIMS,
            key=lambda t: sqrt((width - t[0]) ** 2 + (height - t[1]) ** 2),
        )
        results.append({
            "page": 1,
            "rule_id": "KDP_TRIM_PROFILE",
            "severity": "WARNING",
            "message": f"PDF trim {width:.2f}x{height:.2f}\" not in KDP allowed sizes: {ALLOWED_KDP_TRIMS}. Suggested closest trim: {closest_trim[0]}x{closest_trim[1]}\"",
            "bbox": None,
        })
    return results
