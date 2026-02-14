-- Ensure Admin (employer) role for users who need shortlist access
-- Run this if shortlisting fails with "Permission denied" - RLS requires employer/investor in user_roles
-- Idempotent: safe to run multiple times

-- 1. Set employer role by email (primary admin)
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'allan.mbuthia.nganga@gmail.com';

UPDATE public.profiles p
SET user_type = 'employer'
WHERE p.id IN (SELECT id FROM auth.users WHERE email = 'allan.mbuthia.nganga@gmail.com');

-- 2. Set employer role by username (fallback for allan.mbuthia variants)
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM public.profiles p
WHERE ur.user_id = p.id
  AND (p.username ILIKE 'allan.mbuthia%' OR p.username ILIKE '%allan.mbuthia%');

UPDATE public.profiles
SET user_type = 'employer'
WHERE username ILIKE 'allan.mbuthia%' OR username ILIKE '%allan.mbuthia%';

-- 3. Ensure user_roles row exists for any profile missing one
INSERT INTO public.user_roles (user_id, role)
SELECT p.id,
  CASE
    WHEN p.username ILIKE 'allan.mbuthia%' OR p.username ILIKE '%allan.mbuthia%' THEN 'employer'::app_role
    WHEN p.id IN (SELECT id FROM auth.users WHERE email = 'allan.mbuthia.nganga@gmail.com') THEN 'employer'::app_role
    ELSE 'founder'::app_role
  END
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
ON CONFLICT (user_id, role) DO NOTHING;
