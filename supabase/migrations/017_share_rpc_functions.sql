-- ─────────────────────────────────────────────────────────────────────────────
-- 017_share_rpc_functions.sql
-- Atomic counter helpers for share_tokens table.
-- Called from API routes (best-effort, no user context required).
-- ─────────────────────────────────────────────────────────────────────────────

-- Increment total_clicks by 1 for a given token
CREATE OR REPLACE FUNCTION increment_share_clicks(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_tokens
  SET total_clicks = total_clicks + 1
  WHERE token = p_token;
END;
$$;

-- Increment total_conversions_pending by 1 for a given token
CREATE OR REPLACE FUNCTION increment_share_conversions_pending(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_tokens
  SET total_conversions_pending = total_conversions_pending + 1
  WHERE token = p_token;
END;
$$;

-- Called by cron on award: move 1 from pending → confirmed total
-- Floors pending at 0 to guard against double-fire
CREATE OR REPLACE FUNCTION award_share_conversion(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_tokens
  SET
    total_conversions         = total_conversions + 1,
    total_conversions_pending = GREATEST(total_conversions_pending - 1, 0)
  WHERE token = p_token;
END;
$$;

-- Revoke: drop a pending counter (e.g. voided reward)
CREATE OR REPLACE FUNCTION void_share_conversion_pending(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_tokens
  SET total_conversions_pending = GREATEST(total_conversions_pending - 1, 0)
  WHERE token = p_token;
END;
$$;

-- Grant execute to service_role (anon/authenticated are blocked via RLS)
GRANT EXECUTE ON FUNCTION increment_share_clicks(TEXT)            TO service_role;
GRANT EXECUTE ON FUNCTION increment_share_conversions_pending(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION award_share_conversion(TEXT)            TO service_role;
GRANT EXECUTE ON FUNCTION void_share_conversion_pending(TEXT)     TO service_role;
