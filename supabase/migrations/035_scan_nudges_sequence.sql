-- 035_scan_nudges_sequence.sql
-- Extends scan_nudges to support a 3-step email nurture sequence.
--
-- Column mapping:
--   sent_at          = Email 1 sent (existing)
--   nudge_2_sent_at  = Email 2 sent (new — educational, ~day 3)
--   nudge_3_sent_at  = Email 3 sent (new — urgency/expiry, ~day 7)
--   converted_at     = user purchased — stops sequence at any step

ALTER TABLE scan_nudges ADD COLUMN IF NOT EXISTS nudge_2_sent_at TIMESTAMPTZ;
ALTER TABLE scan_nudges ADD COLUMN IF NOT EXISTS nudge_3_sent_at TIMESTAMPTZ;
ALTER TABLE scan_nudges ADD COLUMN IF NOT EXISTS converted_at    TIMESTAMPTZ;

-- Index for Pass 2 query (find unconverted users ready for Email 2)
CREATE INDEX IF NOT EXISTS idx_scan_nudges_nudge2
  ON scan_nudges (sent_at)
  WHERE nudge_2_sent_at IS NULL AND converted_at IS NULL;

-- Index for Pass 3 query (find unconverted users ready for Email 3)
CREATE INDEX IF NOT EXISTS idx_scan_nudges_nudge3
  ON scan_nudges (nudge_2_sent_at)
  WHERE nudge_3_sent_at IS NULL AND converted_at IS NULL;
