-- ─────────────────────────────────────────────────────────────────────────────
-- 035_atomic_credit_redeem_and_durable_rate_limit.sql
-- Atomic scan-credit redemption + durable API rate limiting helpers.
-- ─────────────────────────────────────────────────────────────────────────────

-- Durable per-bucket rate limit storage (survives serverless cold starts).
CREATE TABLE IF NOT EXISTS api_rate_limits (
  bucket TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at ON api_rate_limits(updated_at);

CREATE OR REPLACE FUNCTION check_durable_rate_limit(
  p_bucket TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF p_bucket IS NULL OR LENGTH(TRIM(p_bucket)) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, v_now;
    RETURN;
  END IF;
  IF p_max <= 0 OR p_window_seconds <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, v_now;
    RETURN;
  END IF;

  v_window_start := TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM v_now) / p_window_seconds) * p_window_seconds);

  INSERT INTO api_rate_limits (bucket, window_start, request_count, updated_at)
  VALUES (p_bucket, v_window_start, 1, v_now)
  ON CONFLICT (bucket) DO UPDATE
  SET
    request_count = CASE
      WHEN api_rate_limits.window_start = EXCLUDED.window_start
        THEN api_rate_limits.request_count + 1
      ELSE 1
    END,
    window_start = EXCLUDED.window_start,
    updated_at = EXCLUDED.updated_at
  RETURNING request_count INTO v_count;

  RETURN QUERY
  SELECT
    v_count <= p_max,
    GREATEST(p_max - v_count, 0),
    v_window_start + MAKE_INTERVAL(secs => p_window_seconds);
END;
$$;

-- Atomic redemption: one credit debit per download_id, with balance check under lock.
CREATE OR REPLACE FUNCTION redeem_scan_credit_atomic(
  p_email TEXT,
  p_download_id TEXT,
  p_required INTEGER DEFAULT 1
)
RETURNS TABLE(ok BOOLEAN, remaining INTEGER, reason TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_download_id TEXT := TRIM(COALESCE(p_download_id, ''));
  v_required INTEGER := GREATEST(COALESCE(p_required, 1), 1);
  v_remaining_before INTEGER := 0;
BEGIN
  IF v_email = '' OR POSITION('@' IN v_email) = 0 OR v_download_id = '' THEN
    RETURN QUERY SELECT FALSE, 0, 'invalid_request';
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(HASHTEXT(v_email)::BIGINT);

  IF EXISTS (
    SELECT 1
    FROM scan_credits
    WHERE source = 'scan_used'
      AND order_id = v_download_id
  ) THEN
    SELECT COALESCE(SUM(credits), 0)::INTEGER
      INTO v_remaining_before
    FROM scan_credits
    WHERE email = v_email
      AND (expires_at IS NULL OR expires_at > NOW());

    RETURN QUERY SELECT TRUE, GREATEST(v_remaining_before, 0), 'already_unlocked';
    RETURN;
  END IF;

  SELECT COALESCE(SUM(credits), 0)::INTEGER
    INTO v_remaining_before
  FROM scan_credits
  WHERE email = v_email
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_remaining_before < v_required THEN
    RETURN QUERY SELECT FALSE, GREATEST(v_remaining_before, 0), 'insufficient_credits';
    RETURN;
  END IF;

  INSERT INTO scan_credits (email, credits, source, order_id)
  VALUES (v_email, -v_required, 'scan_used', v_download_id);

  RETURN QUERY SELECT TRUE, GREATEST(v_remaining_before - v_required, 0), 'redeemed';
  RETURN;

EXCEPTION
  WHEN unique_violation THEN
    SELECT COALESCE(SUM(credits), 0)::INTEGER
      INTO v_remaining_before
    FROM scan_credits
    WHERE email = v_email
      AND (expires_at IS NULL OR expires_at > NOW());
    RETURN QUERY SELECT TRUE, GREATEST(v_remaining_before, 0), 'already_unlocked';
END;
$$;

