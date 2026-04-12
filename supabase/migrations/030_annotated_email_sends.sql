-- ─────────────────────────────────────────────────────────────────────────────
-- 030_annotated_email_sends.sql
-- Idempotency lock for annotated-PDF ready emails (Postgres claim before Resend).
-- RLS enabled with no policies: anon/authenticated cannot access; service_role bypasses.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS annotated_email_sends (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  download_id      TEXT        NOT NULL UNIQUE,
  status             TEXT        NOT NULL DEFAULT 'pending',
  resend_message_id  TEXT,
  error              TEXT,
  recipient_email    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT annotated_email_sends_status_chk
    CHECK (status IN ('pending', 'sent', 'failed'))
);

COMMENT ON TABLE annotated_email_sends IS 'At most one annotated-email send pipeline per download_id; application sets status after Resend.';

ALTER TABLE annotated_email_sends ENABLE ROW LEVEL SECURITY;
