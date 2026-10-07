-- Backup of the 4 dead share-to-earn functions dropped by migration
-- "harden_functions_drop_dead_share_rpcs" (2026-10-07, Supabase security advisor clean-up).
-- Run this file to restore them if ever needed.

CREATE OR REPLACE FUNCTION public.award_share_conversion(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE share_tokens
  SET
    total_conversions         = total_conversions + 1,
    total_conversions_pending = GREATEST(total_conversions_pending - 1, 0)
  WHERE token = p_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_share_clicks(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE share_tokens
  SET total_clicks = total_clicks + 1
  WHERE token = p_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_share_conversions_pending(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE share_tokens
  SET total_conversions_pending = total_conversions_pending + 1
  WHERE token = p_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.void_share_conversion_pending(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE share_tokens
  SET total_conversions_pending = GREATEST(total_conversions_pending - 1, 0)
  WHERE token = p_token;
END;
$function$;
