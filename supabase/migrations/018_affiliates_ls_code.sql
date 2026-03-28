-- ─────────────────────────────────────────────────────────────────────────────
-- 018_affiliates_ls_code.sql
-- Stores the LemonSqueezy affiliate code for each approved partner.
-- Used to construct the LS payout link: https://manu2print.lemonsqueezy.com/?aff={code}
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS ls_affiliate_code TEXT;
