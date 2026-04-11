-- Optional KDP trim id from checker upload (e.g. 8.5x11) for spec-table comparison target.
ALTER TABLE print_ready_checks ADD COLUMN IF NOT EXISTS intended_trim_id text;

CREATE OR REPLACE FUNCTION claim_print_ready_check()
RETURNS TABLE (
  id uuid,
  file_key text,
  our_job_id uuid,
  file_size_mb numeric,
  intended_trim_id text
)
LANGUAGE sql
AS $$
  WITH picked AS (
    SELECT p.id, p.status
    FROM print_ready_checks p
    WHERE p.status = 'pending'
       OR (p.status = 'processing' AND p.updated_at < now() - interval '15 minutes')
    ORDER BY p.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE print_ready_checks prc
  SET
    status = 'processing',
    started_at = now(),
    finished_at = null,
    retry_count = CASE WHEN picked.status = 'processing' THEN COALESCE(prc.retry_count, 0) + 1 ELSE prc.retry_count END,
    updated_at = now()
  FROM picked
  WHERE prc.id = picked.id
  RETURNING prc.id, prc.file_key, prc.our_job_id, prc.file_size_mb, prc.intended_trim_id;
$$;

COMMENT ON COLUMN print_ready_checks.intended_trim_id IS 'Optional checker UI trim id (TRIM_SIZES / HARDCOVER id); used for report spec row only.';
