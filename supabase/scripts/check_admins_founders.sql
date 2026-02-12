-- Run this in Supabase SQL Editor to see current admins and founders
-- Admins = employer or investor | Founders = founder or talent

SELECT 
  p.username,
  au.email,
  p.user_type,
  ur.role,
  CASE 
    WHEN ur.role IN ('employer', 'investor') THEN 'ADMIN'
    WHEN ur.role IN ('founder', 'talent') THEN 'FOUNDER'
    ELSE 'OTHER'
  END AS role_type
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY role_type, p.username;
