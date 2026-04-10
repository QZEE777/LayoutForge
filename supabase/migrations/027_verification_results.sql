-- Public verification results for KDP PDF Checker scans.
-- Written on scan completion; read by /verify/[id] (public, no auth).
CREATE TABLE IF NOT EXISTS verification_results (
  verification_id   text PRIMARY KEY,
  filename_clean    text,
  readiness_score   integer,
  kdp_ready         boolean,
  scan_date         timestamptz,
  issues_count      integer,
  approval_likelihood numeric(5,2),
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- Public read (no auth required — verify links are shared publicly)
ALTER TABLE verification_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_verification_results"
  ON verification_results
  FOR SELECT
  USING (true);

-- Only service role can insert / upsert (API routes use service role key)
CREATE POLICY "service_role_write_verification_results"
  ON verification_results
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE verification_results IS 'Public verification records for KDP PDF Checker scans. Read by /verify/[id].';
