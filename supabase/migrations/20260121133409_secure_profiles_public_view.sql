-- ============================================================================
-- SECURITY FIX: Restrict profiles_public view to authenticated users only
-- ============================================================================
-- Problem: The profiles_public view and related functions were accessible
-- to unauthenticated (anon) users, allowing anyone to scrape user data
-- including usernames, avatars, bios, skills, and verification status.
--
-- Solution: Revoke access from anon role and grant only to authenticated users.
-- This ensures only logged-in users can view other users' public profiles.
-- ============================================================================

-- Step 1: Revoke all access from anon (unauthenticated) role on the view
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM public;

-- Step 2: Grant access only to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Step 3: Revoke anon access from profile-related functions
REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_all_public_profiles() FROM anon;
REVOKE ALL ON FUNCTION public.get_all_public_profiles() FROM public;
GRANT EXECUTE ON FUNCTION public.get_all_public_profiles() TO authenticated;

-- Step 4: Also secure the video-related functions
REVOKE ALL ON FUNCTION public.get_public_videos(integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_videos(integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_videos(integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_public_videos(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_public_videos(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_public_videos(uuid) TO authenticated;

-- Step 5: Secure the videos_public view if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'videos_public' AND table_schema = 'public') THEN
    REVOKE ALL ON public.videos_public FROM anon;
    REVOKE ALL ON public.videos_public FROM public;
    GRANT SELECT ON public.videos_public TO authenticated;
  END IF;
END $$;

-- Step 6: Add comments documenting the security model
COMMENT ON VIEW public.profiles_public IS 
'Public profile view (excludes email). SECURITY: Only accessible to authenticated users.
Unauthenticated users cannot view any profile data.';

COMMENT ON FUNCTION public.get_public_profile(uuid) IS 
'Get a single user''s public profile. SECURITY: Requires authentication.';

COMMENT ON FUNCTION public.get_all_public_profiles() IS 
'Get all users'' public profiles. SECURITY: Requires authentication.';

-- ============================================================================
-- SECURITY MODEL SUMMARY:
-- 
-- Anonymous (not logged in):
--   ❌ Cannot view profiles_public
--   ❌ Cannot call get_public_profile()
--   ❌ Cannot call get_all_public_profiles()
--   ❌ Cannot view videos_public
--
-- Authenticated (logged in):
--   ✅ Can view profiles_public (excludes email)
--   ✅ Can call get_public_profile() 
--   ✅ Can call get_all_public_profiles()
--   ✅ Can view their own full profile (via profiles table with RLS)
--
-- This ensures user data is only visible to other registered users,
-- preventing scraping by bots or unauthenticated attackers.
-- ============================================================================
