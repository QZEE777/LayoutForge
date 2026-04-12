"""Unit tests for bbox enrichment (no PDF fixtures required)."""
from __future__ import annotations

import unittest

from app.core.bbox_enrichment import ensure_issue_bboxes


class TestEnsureIssueBboxes(unittest.TestCase):
    def setUp(self) -> None:
        self.geom = {
            1: {
                "media_w": 612.0,
                "media_h": 792.0,
                "trim_rect": (0.0, 0.0, 612.0, 792.0),
                "trim_w": 612.0,
                "trim_h": 792.0,
                "safe_left": 72.0,
                "safe_right": 540.0,
                "safe_top": 72.0,
                "safe_bottom": 720.0,
                "bleed_pt": 9.0,
                "gutter_pt": 27.0,
            },
        }

    def test_margin_issue_null_bbox_gets_non_null(self) -> None:
        issues = [
            {
                "page": 1,
                "rule_id": "GUTTER_MARGIN",
                "severity": "ERROR",
                "message": "Text inside gutter margin.",
                "bbox": None,
            },
        ]
        out = ensure_issue_bboxes(issues, self.geom)
        self.assertEqual(len(out), 1)
        bb = out[0]["bbox"]
        self.assertIsNotNone(bb)
        self.assertEqual(len(bb), 4)
        x, y, w, h = bb
        self.assertGreater(w, 0)
        self.assertGreater(h, 0)
        self.assertGreaterEqual(x, 0)
        self.assertGreaterEqual(y, 0)
        self.assertTrue(all(float(v) == v for v in bb))

    def test_existing_bbox_not_overwritten(self) -> None:
        original = [10.0, 20.0, 100.0, 200.0]
        issues = [
            {
                "page": 1,
                "rule_id": "GUTTER_MARGIN",
                "severity": "ERROR",
                "message": "x",
                "bbox": list(original),
            },
        ]
        out = ensure_issue_bboxes(issues, self.geom)
        self.assertEqual(out[0]["bbox"], original)

    def test_schema_positive_dimensions(self) -> None:
        issues = [
            {
                "page": 1,
                "rule_id": "MIN_PAGE_COUNT",
                "severity": "ERROR",
                "message": "Too few pages",
                "bbox": None,
            },
        ]
        out = ensure_issue_bboxes(issues, self.geom)
        x, y, w, h = out[0]["bbox"]
        self.assertGreater(w, 0)
        self.assertGreater(h, 0)
        self.assertGreaterEqual(x, 0)
        self.assertGreaterEqual(y, 0)


if __name__ == "__main__":
    unittest.main()
