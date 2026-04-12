-- ─────────────────────────────────────────────────────────────────────────────
-- 033_payments_marketing_columns.sql
-- Links Lemon Squeezy payments to checker download + TTL anchor for lifecycle emails.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS download_id text,
  ADD COLUMN IF NOT EXISTS download_ttl_anchor_at timestamptz,
  ADD COLUMN IF NOT EXISTS post_purchase_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_warning_sent boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN payments.download_id IS 'Checker manuscript id from LS custom_data when present.';
COMMENT ON COLUMN payments.download_ttl_anchor_at IS 'When the paid download email was sent; used for 24h follow-up and expiry-warning windows.';
COMMENT ON COLUMN payments.post_purchase_email_sent IS 'True after 24h post-purchase nurture email sent.';
COMMENT ON COLUMN payments.expiry_warning_sent IS 'True after 2h-before-expiry warning email sent.';

CREATE INDEX IF NOT EXISTS idx_payments_download_ttl_anchor
  ON payments (download_ttl_anchor_at)
  WHERE post_purchase_email_sent = false AND status = 'complete';

CREATE INDEX IF NOT EXISTS idx_payments_expiry_warning
  ON payments (download_ttl_anchor_at)
  WHERE expiry_warning_sent = false AND status = 'complete' AND download_id IS NOT NULL;
