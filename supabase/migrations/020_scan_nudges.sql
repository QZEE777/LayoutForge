-- 020_scan_nudges.sql
-- Captures email + download_id when a user enters their email
-- at the payment step but doesn't complete the purchase.
-- A daily cron sends a single follow-up nudge after 24 hours.

CREATE TABLE IF NOT EXISTS scan_nudges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL,
  download_id    TEXT NOT NULL,
  sent_at        TIMESTAMPTZ,           -- NULL = not yet sent
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, download_id)            -- one nudge per user per scan
);

CREATE INDEX IF NOT EXISTS idx_scan_nudges_unsent
  ON scan_nudges (created_at)
  WHERE sent_at IS NULL;
