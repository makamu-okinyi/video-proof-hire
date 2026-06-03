-- Role-escalation lockdown + employer/admin split.
-- Authorization for admin/review powers is now has_role('admin') ONLY — never
-- email, employer, investor, can_shortlist, or profiles.user_type.

-- (1) Self-service role changes: strict whitelist (talent/founder/employer only).
CREATE OR REPLACE FUNCTION public.update_user_role(new_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new_role NOT IN ('talent'::app_role, 'founder'::app_role, 'employer'::app_role) THEN
    RAISE EXCEPTION 'Role % cannot be self-assigned; ask an admin', new_role
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.user_roles SET role = new_role        WHERE user_id = auth.uid();
  UPDATE public.profiles   SET user_type = new_role::text WHERE id = auth.uid();
END; $$;

-- (2) Admin-only grant path for vetted roles (investor/judge/admin).
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user uuid, new_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.user_roles SET role = new_role WHERE user_id = target_user;
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user, new_role)
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  UPDATE public.profiles SET user_type = new_role::text WHERE id = target_user;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;

-- (3) venture_founders: creator may claim only a venture that has no founders yet.
-- TODO(post-launch): co-founder invite/approval flow (deliberately not built for launch).
DROP POLICY IF EXISTS "Users can add themselves as founders" ON public.venture_founders;
DROP POLICY IF EXISTS "Creator can claim a new venture as first founder" ON public.venture_founders;
CREATE POLICY "Creator can claim a new venture as first founder"
ON public.venture_founders FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.venture_founders e WHERE e.venture_id = venture_founders.venture_id)
);

-- (4) Seed the initial admin from the email allowlist (SEED ONLY; authz no longer uses email).
UPDATE public.user_roles ur SET role = 'admin'::app_role
  FROM auth.users u WHERE ur.user_id = u.id AND u.email = 'allan.mbuthia.nganga@gmail.com';
UPDATE public.profiles p SET user_type = 'admin'
  FROM auth.users u WHERE p.id = u.id AND u.email = 'allan.mbuthia.nganga@gmail.com';

-- (5) Re-scope every admin-review policy/RPC to has_role('admin') ONLY.
DROP POLICY IF EXISTS "Admins can view all ventures for review" ON public.ventures;
CREATE POLICY "Admins can view all ventures for review" ON public.ventures FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update venture review status" ON public.ventures;
CREATE POLICY "Admins can update venture review status" ON public.ventures FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view founder profiles for review" ON public.profiles;
CREATE POLICY "Admins can view founder profiles for review" ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_venture_review_status(p_venture_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_status NOT IN ('shortlisted','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.ventures SET review_status = p_status WHERE id = p_venture_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venture not found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_job_application_status(p_application_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owns_job boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    NULL;  -- admins may update any application
  ELSE
    SELECT EXISTS (SELECT 1 FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      WHERE ja.id = p_application_id AND jp.employer_id = auth.uid()) INTO v_owns_job;  -- job owner (hiring)
    IF NOT v_owns_job THEN
      RAISE EXCEPTION 'Permission denied: must own the job or be an admin' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  UPDATE public.job_applications SET status = p_status WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
END; $$;

DROP POLICY IF EXISTS "Employers can create conversations with shortlisted candidates" ON public.conversations;
CREATE POLICY "Employers can create conversations with shortlisted candidates"
ON public.conversations FOR INSERT WITH CHECK (
  auth.uid() = employer_id AND (
    (job_application_id IS NOT NULL AND EXISTS (
       SELECT 1 FROM job_applications WHERE id = job_application_id AND status = 'shortlisted'))
    OR (venture_id IS NOT NULL AND job_application_id IS NULL
        AND public.has_role(auth.uid(), 'admin')
        AND EXISTS (SELECT 1 FROM venture_founders vf WHERE vf.venture_id = conversations.venture_id AND vf.user_id = candidate_id))
  )
);
