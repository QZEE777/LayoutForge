-- Fix: OAuth (e.g. Google) can leave auth.users.email null; trigger was failing on NOT NULL.
-- Use email from raw_user_meta_data when email column is null.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
BEGIN
  user_email := COALESCE(
    new.email,
    new.raw_user_meta_data->>'email',
    ''
  );
  INSERT INTO public.profiles (id, email, is_founder)
  VALUES (
    new.id,
    user_email,
    (SELECT COUNT(*) FROM public.profiles) < 500
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
