-- Add Wise payout email to affiliates table.
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS wise_email text;

COMMENT ON COLUMN affiliates.wise_email IS 'Wise (formerly TransferWise) email for international commission payouts';
