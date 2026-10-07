-- Applied to production 2026-10-07 (Supabase security advisor clean-up).
-- Rollback for the dropped functions: supabase/rollback/2026-10-07_share_functions_backup.sql

-- 1. Dead share-to-earn RPCs (feature removed 2026-04-22)
DROP FUNCTION IF EXISTS public.award_share_conversion(text);
DROP FUNCTION IF EXISTS public.increment_share_clicks(text);
DROP FUNCTION IF EXISTS public.increment_share_conversions_pending(text);
DROP FUNCTION IF EXISTS public.void_share_conversion_pending(text);

-- 2. Trigger / event-trigger helpers: not meant to be called over the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 3. Pin search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.claim_print_ready_check() SET search_path = public;
ALTER FUNCTION public.increment_blog_view(text) SET search_path = public;
