-- Drop the security definer view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate view with SECURITY INVOKER (uses querying user's permissions)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  user_type,
  bio,
  skills,
  skill_category,
  is_verified,
  avatar,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add a policy to allow viewing other profiles' non-sensitive data via the base table
-- This is needed because the view with security_invoker will check RLS on the base table
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);