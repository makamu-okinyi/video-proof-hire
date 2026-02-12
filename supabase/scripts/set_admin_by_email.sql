-- Run this in Supabase SQL Editor to set allan.mbuthia.nganga@gmail.com as admin
-- Use this if migrations are not applied via CLI

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

-- 3. Ensure user_roles row exists (if user had no row)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employer'::app_role
FROM auth.users u
WHERE u.email = 'allan.mbuthia.nganga@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;
