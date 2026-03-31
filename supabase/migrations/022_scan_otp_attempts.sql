-- ─────────────────────────────────────────────────────────────────────────────
-- 022_scan_otp_attempts.sql
-- Tracks OTP send attempts per email for rate limiting.
-- Replaces the in-memory Map in credits/send-code which resets on cold start.
-- Rate limit enforced in application code: max 5 attempts per email per 15 min.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_otp_attempts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_otp_attempts_email_time
  ON scan_otp_attempts(email, created_at);
