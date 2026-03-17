-- Atomic claim for Print Ready Check worker: one job per call, with stuck-job reclaim after 15 minutes.
CREATE INDEX IF NOT EXISTS idx_print_ready_checks_processing_updated_at
  ON print_ready_checks (updated_at)
  WHERE status = 'processing';

CREATE OR REPLACE FUNCTION claim_print_ready_check()
RETURNS TABLE (id uuid, file_key text, our_job_id uuid, file_size_mb numeric)
LANGUAGE sql
AS $$
  UPDATE print_ready_checks prc
  SET status = 'processing', updated_at = now()
  WHERE prc.id = (
    SELECT p.id FROM print_ready_checks p
    WHERE p.status = 'pending'
       OR (p.status = 'processing' AND p.updated_at < now() - interval '15 minutes')
    ORDER BY p.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING prc.id, prc.file_key, prc.our_job_id, prc.file_size_mb;
$$;

COMMENT ON FUNCTION claim_print_ready_check() IS 'Atomically claim one print_ready_checks job (pending or stale processing >15m). Worker calls via RPC.';
