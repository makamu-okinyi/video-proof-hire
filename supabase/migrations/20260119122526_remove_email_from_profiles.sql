-- ============================================================================
-- SECURITY FIX: Remove email column from profiles table
-- ============================================================================
-- Problem: The profiles table stores email addresses which could potentially
-- be exposed through various queries, even with RLS policies in place.
-- 
-- Solution: Remove the email column entirely since emails are already stored
-- securely in Supabase's auth.users table. Applications should get the user's
-- email from the authenticated session, not from the profiles table.
-- ============================================================================

-- Step 1: Remove email column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Step 2: Update the handle_new_user trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Step 3: Update the profiles_public view to remove any email reference
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  username,
  user_type,
  bio,
  skills,
  skill_category,
  is_verified,
  avatar,
  created_at,
  updated_at
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS 
'Public view of profiles. Email addresses are NOT stored in this table - 
they are only available in auth.users for security reasons.';

-- Step 4: Update get_public_profile function (ensure no email exposure)
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  user_type text,
  bio text,
  skills text[],
  skill_category text,
  is_verified boolean,
  avatar text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.user_type,
    p.bio,
    p.skills,
    p.skill_category,
    p.is_verified,
    p.avatar,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Step 5: Update get_all_public_profiles function
DROP FUNCTION IF EXISTS public.get_all_public_profiles();

CREATE OR REPLACE FUNCTION public.get_all_public_profiles()
RETURNS TABLE(
  id uuid,
  username text,
  user_type text,
  bio text,
  skills text[],
  skill_category text,
  is_verified boolean,
  avatar text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.username,
    p.user_type,
    p.bio,
    p.skills,
    p.skill_category,
    p.is_verified,
    p.avatar,
    p.created_at
  FROM public.profiles p;
$$;

-- Add documentation
COMMENT ON TABLE public.profiles IS 
'User profiles table. NOTE: Email addresses are NOT stored here for security.
User emails are only available in auth.users and should be accessed via the
authenticated user session (supabase.auth.getUser()).';

-- ============================================================================
-- IMPORTANT: After applying this migration, update your application code to:
-- 1. Get user email from session.user.email or user.email (from auth)
-- 2. Remove any references to profile.email in the codebase
-- ============================================================================
