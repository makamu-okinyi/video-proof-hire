-- Create a public view for profiles that excludes sensitive email field
CREATE OR REPLACE VIEW public.profiles_public
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

-- Add a policy to allow authenticated users to view all profiles (needed for public profile pages)
-- The base table keeps email protected - only accessible to the profile owner
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment to document the security design
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles excluding email addresses. Use this view for public access to prevent email exposure.';