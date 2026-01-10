-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- Drop the view - we'll use a function instead
DROP VIEW IF EXISTS public.public_profiles;

-- Create a security definer function to get public profile data (excludes email)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  user_type text,
  bio text,
  skills text[],
  skill_category text,
  is_verified boolean,
  avatar text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Create a function to get all public profiles (for listings, search, etc.)
CREATE OR REPLACE FUNCTION public.get_all_public_profiles()
RETURNS TABLE (
  id uuid,
  username text,
  user_type text,
  bio text,
  skills text[],
  skill_category text,
  is_verified boolean,
  avatar text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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