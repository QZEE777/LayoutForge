-- increment_blog_view was callable by anon/authenticated, so anyone with the public
-- key could inflate blog view counts directly. Only the server route (service role)
-- needs it.
REVOKE EXECUTE ON FUNCTION public.increment_blog_view(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_view(text) TO service_role;
