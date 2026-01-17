-- Fix email exposure: Update RLS policy on profiles to only allow users to see their own email
-- Other users should use the profiles_public view which excludes email

-- Drop the existing policy that allows viewing own profile (it's currently the only SELECT policy)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows users to view ONLY their own profile
-- This ensures email is only visible to the profile owner
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Note: The profiles_public view and get_public_profile() RPC already exclude email
-- So other users accessing profiles should use those instead