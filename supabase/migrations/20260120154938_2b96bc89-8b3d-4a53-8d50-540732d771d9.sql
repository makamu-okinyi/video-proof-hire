-- Remove email column from profiles table (emails should only be accessed via auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;