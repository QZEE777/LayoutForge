-- Forward-only observability fix for existing production databases.
-- Keeps previous migration history intact and applies only missing columns/indexes.

ALTER TABLE print_ready_checks
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

ALTER TABLE print_ready_checks
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

ALTER TABLE print_ready_checks
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE print_ready_checks
ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_prc_status ON print_ready_checks(status);
CREATE INDEX IF NOT EXISTS idx_prc_updated_at ON print_ready_checks(updated_at);
