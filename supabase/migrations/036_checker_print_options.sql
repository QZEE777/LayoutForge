-- Local draft: apply/test in an isolated database before coordinated rollout.
-- Keep the existing claim RPC signature unchanged; the worker reads this after claiming.
ALTER TABLE public.print_ready_checks ADD COLUMN IF NOT EXISTS print_options jsonb;
COMMENT ON COLUMN public.print_ready_checks.print_options IS
  'Validated checker bookType, bleedMode, colorMode and paperType. NULL means legacy job: choices unknown; rescan required.';
