-- ─────────────────────────────────────────────────────────────────────────────
-- 025_affiliates_crypto_wallet.sql
-- Adds XRP / XLM crypto payout fields to the affiliates table.
-- Wallet address is a public key — safe to store, zero financial liability.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS payout_coin   TEXT,  -- 'xrp' | 'xlm'
  ADD COLUMN IF NOT EXISTS payout_wallet TEXT,  -- public wallet address
  ADD COLUMN IF NOT EXISTS payout_memo   TEXT;  -- XRP destination tag or XLM memo (optional)

COMMENT ON COLUMN affiliates.payout_coin   IS 'Preferred crypto payout coin: xrp or xlm';
COMMENT ON COLUMN affiliates.payout_wallet IS 'Public wallet address for crypto payouts — not sensitive';
COMMENT ON COLUMN affiliates.payout_memo   IS 'XRP destination tag or XLM memo — required by some exchanges';
