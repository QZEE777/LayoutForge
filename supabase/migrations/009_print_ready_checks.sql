-- Async Print Ready Check jobs (large-file flow). Worker polls pending rows and updates with result.
CREATE TABLE IF NOT EXISTS print_ready_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key text NOT NULL,
  our_job_id uuid NOT NULL,
  file_size_mb numeric(10, 4),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  result_download_id uuid,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_print_ready_checks_status ON print_ready_checks (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_print_ready_checks_created_at ON print_ready_checks (created_at);

COMMENT ON TABLE print_ready_checks IS 'Async KDP Print Ready Check jobs; worker processes pending and sets result_download_id or error_message';
