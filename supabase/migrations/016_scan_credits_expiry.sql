-- ─────────────────────────────────────────────────────────────────────────────
-- 016_scan_credits_expiry.sql
-- Adds optional expires_at column to scan_credits.
-- Used by the share-reward cron to enforce 60-day credit expiry.
-- Pack/paid credits leave this NULL (never expire).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE scan_credits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scan_credits_expires_at ON scan_credits(expires_at)
  WHERE expires_at IS NOT NULL;

-- Add reward_id FK so we can trace a scan_credit row back to the share_reward
ALTER TABLE scan_credits ADD COLUMN IF NOT EXISTS share_reward_id UUID;

-- Unique constraint so cron double-fire produces a harmless conflict, not a duplicate credit
CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_credits_share_reward_id
  ON scan_credits(share_reward_id)
  WHERE share_reward_id IS NOT NULL;
