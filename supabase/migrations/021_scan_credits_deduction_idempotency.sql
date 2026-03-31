-- ─────────────────────────────────────────────────────────────────────────────
-- 021_scan_credits_deduction_idempotency.sql
-- Prevents double-deduction of scan credits under concurrent requests.
-- At most one "scan_used" row may exist per downloadId (order_id), so a second
-- concurrent INSERT fails with a unique-constraint violation rather than
-- silently deducting a second credit.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_credits_scan_used_order_id
  ON scan_credits(order_id)
  WHERE source = 'scan_used' AND order_id IS NOT NULL;
