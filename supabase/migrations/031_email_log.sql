-- ─────────────────────────────────────────────────────────────────────────────
-- 031_email_log.sql
-- Append-only observability for outbound email (service inserts only).
-- RLS enabled with no policies: anon/authenticated cannot access; service_role bypasses.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_log (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email    TEXT        NOT NULL,
  event_type         TEXT        NOT NULL,
  subject            TEXT,
  resend_message_id  TEXT,
  error              TEXT,
  metadata           JSONB,
  sent_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_event_type ON email_log(event_type);

COMMENT ON TABLE email_log IS 'Outbound email audit trail; populated from application after Resend calls.';

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
