-- Add name to formatter_leads for email capture section
ALTER TABLE formatter_leads ADD COLUMN IF NOT EXISTS name text;
