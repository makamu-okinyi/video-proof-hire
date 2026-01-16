-- Remove dangerous INSERT and UPDATE policies that allow privilege escalation
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- The SELECT policy remains so users can view their own roles
-- Role assignment is handled server-side via:
-- 1. handle_new_user_role() trigger - assigns default 'talent' role on signup
-- 2. update_user_role() SECURITY DEFINER function - controlled role updates

-- Add comment to document the security design
COMMENT ON TABLE public.user_roles IS 'User roles table. INSERT/UPDATE restricted to server-side functions only to prevent privilege escalation.';