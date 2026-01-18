-- ============================================================================
-- SECURITY FIX: Protect email addresses in profiles table
-- ============================================================================
-- Problem: The profiles table contains email addresses that could be exposed
-- to other authenticated users through overly permissive RLS policies.
--
-- Solution: 
-- 1. Remove ALL SELECT policies on profiles table
-- 2. Create ONLY a policy that lets users view their OWN profile
-- 3. Create/update a secure view (profiles_public) for viewing OTHER users
-- 4. Create secure RPC functions for public profile access
-- ============================================================================

-- Step 1: Drop ALL existing SELECT policies on profiles to start fresh
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- Step 2: Create the ONLY SELECT policy - users can ONLY see their own profile
-- This protects the email column from being accessed by other users
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Step 3: Recreate the profiles_public view (excludes email)
-- This view is used for accessing other users' public profile information
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

-- Add documentation
COMMENT ON VIEW public.profiles_public IS 
'Public view of profiles that EXCLUDES email addresses. 
Use this view when displaying other users profiles to prevent email exposure.
The base profiles table is protected by RLS - users can only see their own profile.';

-- Step 4: Create/update secure RPC function to get a single public profile
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

-- Step 5: Create/update secure RPC function to get all public profiles
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

-- Add documentation for the functions
COMMENT ON FUNCTION public.get_public_profile(uuid) IS 
'Securely retrieves a single user profile WITHOUT the email address. 
Use this function when displaying another users profile.';

COMMENT ON FUNCTION public.get_all_public_profiles() IS 
'Securely retrieves all user profiles WITHOUT email addresses. 
Use this function when listing users or searching profiles.';

-- ============================================================================
-- VERIFICATION: After applying this migration, test the following:
-- 
-- 1. As User A, try to select from profiles where id = User B's id
--    Expected: Empty result (cannot see other users' profiles directly)
--
-- 2. As User A, select from profiles where id = User A's id  
--    Expected: Returns User A's full profile INCLUDING email
--
-- 3. As User A, call get_public_profile(User B's id)
--    Expected: Returns User B's profile WITHOUT email
--
-- 4. As User A, select from profiles_public where id = User B's id
--    Expected: Returns User B's profile WITHOUT email
-- ============================================================================
