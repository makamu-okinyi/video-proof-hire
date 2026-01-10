-- Drop the overly permissive policy that exposes emails
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Users can only view their own full profile (including email)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a secure view for public profile data (excludes email)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add DELETE policy for GDPR compliance (users can delete their own profile)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);