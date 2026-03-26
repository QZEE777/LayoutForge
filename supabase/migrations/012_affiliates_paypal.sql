-- Add PayPal payout email to affiliates table.
-- Also ensures website/reason columns exist (created via ORM previously).
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS paypal_email text;

COMMENT ON COLUMN affiliates.paypal_email IS 'PayPal email for monthly commission payouts';
