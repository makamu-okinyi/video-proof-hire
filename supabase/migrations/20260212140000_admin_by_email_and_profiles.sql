-- Set admin by email (allan.mbuthia.nganga@gmail.com) - more reliable than username
-- Also allow admins to view founder profiles for the Admin Review Panel

-- 1. Set admin by email in user_roles
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'allan.mbuthia.nganga@gmail.com';

-- 2. Set admin by email in profiles
UPDATE public.profiles
SET user_type = 'employer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'allan.mbuthia.nganga@gmail.com');

-- 3. Ensure user_roles row exists for admin email (if they had no row before)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employer'::app_role
FROM auth.users u
WHERE u.email = 'allan.mbuthia.nganga@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Admins can view founder profiles for the Admin Review Panel (venture_founders -> profiles join)
DROP POLICY IF EXISTS "Admins can view founder profiles for review" ON public.profiles;
CREATE POLICY "Admins can view founder profiles for review"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'employer')
    OR public.has_role(auth.uid(), 'investor')
  );
