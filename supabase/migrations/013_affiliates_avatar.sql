-- Add optional profile photo URL to affiliates table.
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN affiliates.avatar_url IS 'Optional partner profile photo URL';
