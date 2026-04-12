-- ─────────────────────────────────────────────────────────────────────────────
-- 032_post_scan_email_sends.sql
-- Idempotency for post-free-scan marketing email (one row per download_id).
-- sent_at NULL = claim in progress; non-null = successfully sent.
-- RLS enabled with no policies; service_role bypasses.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_scan_email_sends (
  download_id  TEXT        PRIMARY KEY,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE post_scan_email_sends IS 'Post-scan nurture email: claim row with sent_at NULL, then set sent_at after Resend succeeds.';

ALTER TABLE post_scan_email_sends ENABLE ROW LEVEL SECURITY;
