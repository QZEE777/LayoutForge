-- Add per-check boolean columns to verification_results
-- Used to render the social share card breakdown without re-parsing the full report

ALTER TABLE verification_results
  ADD COLUMN IF NOT EXISTS trim_ok     boolean,
  ADD COLUMN IF NOT EXISTS margins_ok  boolean,
  ADD COLUMN IF NOT EXISTS bleed_ok    boolean,
  ADD COLUMN IF NOT EXISTS fonts_ok    boolean;
