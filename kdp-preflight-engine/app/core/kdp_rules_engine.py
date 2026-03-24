"""
KDP Rules Engine: runs all registered rules against analyzed document and collects issues.
Each rule returns a list of {page, rule_id, severity, message, bbox?}.
Document status: PASS if no ERROR; FAIL if any ERROR.
"""
from __future__ import annotations

import structlog
from typing import Any

from app.rules import ALL_RULES

RULESET_VERSION = "kdp_preflight_v2.0.0"

logger = structlog.get_logger(__name__)


def run_validation(doc: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    """
    Run all rules on the analyzed document.
    Returns (errors, warnings, rules_checked).
    """
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    rules_checked = 0

    for rule_id, rule_name, rule_fn in ALL_RULES:
        rules_checked += 1
        try:
            issues = rule_fn(doc)
            for i in issues:
                item = {
                    "page": i.get("page", 0),
                    "rule_id": i.get("rule_id", rule_id),
                    "severity": i.get("severity", "ERROR"),
                    "message": i.get("message", ""),
                    "bbox": i.get("bbox"),
                }
                if item["severity"] == "ERROR":
                    errors.append(item)
                else:
                    warnings.append(item)
        except Exception as e:
            logger.exception("rule_failed", rule_id=rule_id, error=str(e))
            errors.append({
                "page": 1,
                "rule_id": rule_id,
                "severity": "ERROR",
                "message": f"Rule check failed: {e!s}",
                "bbox": None,
            })

    return errors, warnings, rules_checked
