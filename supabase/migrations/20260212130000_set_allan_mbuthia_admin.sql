-- Set allan.mbuthia as admin (employer), all other users as founders
-- Run this migration after your database has profiles and user_roles populated

-- 1. Set allan.mbuthia (and variants like allan.mbuthia..) as admin
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM public.profiles p
WHERE ur.user_id = p.id
  AND (p.username ILIKE 'allan.mbuthia%' OR p.username ILIKE '%allan.mbuthia%');

UPDATE public.profiles
SET user_type = 'employer'
WHERE username ILIKE 'allan.mbuthia%' OR username ILIKE '%allan.mbuthia%';

-- 2. Set all other users as founders
UPDATE public.user_roles ur
SET role = 'founder'::app_role
FROM public.profiles p
WHERE ur.user_id = p.id
  AND NOT (p.username ILIKE 'allan.mbuthia%' OR p.username ILIKE '%allan.mbuthia%');

UPDATE public.profiles
SET user_type = 'founder'
WHERE id IN (SELECT id FROM public.profiles)
  AND NOT (username ILIKE 'allan.mbuthia%' OR username ILIKE '%allan.mbuthia%');

-- 3. Ensure any profile without a user_roles row gets one
INSERT INTO public.user_roles (user_id, role)
SELECT p.id,
  CASE
    WHEN p.username ILIKE 'allan.mbuthia%' OR p.username ILIKE '%allan.mbuthia%' THEN 'employer'::app_role
    ELSE 'founder'::app_role
  END
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
ON CONFLICT (user_id, role) DO NOTHING;
