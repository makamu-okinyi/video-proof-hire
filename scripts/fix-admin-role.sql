-- Run this in Supabase SQL Editor if application shortlisting reverts after reload
-- (Admin Panel: venture shortlisting; Job Applicants: employer shortlisting)
-- Replace YOUR_EMAIL with your actual email, or run as-is for allan.mbuthia.nganga@gmail.com

-- Grant employer role to admin (fixes venture shortlisting RLS)
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'allan.mbuthia.nganga@gmail.com';

UPDATE public.profiles
SET user_type = 'employer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'allan.mbuthia.nganga@gmail.com');

-- Ensure row exists
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employer'::app_role
FROM auth.users u
WHERE u.email = 'allan.mbuthia.nganga@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify: run this to check your role
-- SELECT p.username, p.user_type, ur.role FROM profiles p
-- LEFT JOIN user_roles ur ON ur.user_id = p.id
-- WHERE p.id = auth.uid();
