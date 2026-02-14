-- Run this entire script in Supabase SQL Editor to fix shortlisting for ki@gmail.com

-- 1. Add can_shortlist column (if migration wasn't run)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_shortlist BOOLEAN NOT NULL DEFAULT false;

-- 2. Update RPC functions to respect can_shortlist
CREATE OR REPLACE FUNCTION public.update_venture_review_status(
  p_venture_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_can_shortlist BOOLEAN;
BEGIN
  IF p_status NOT IN ('shortlisted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: must be shortlisted or rejected';
  END IF;
  SELECT COALESCE(p.can_shortlist, false) OR public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')
    OR p.user_type IN ('employer', 'investor')
  INTO v_can_shortlist
  FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
  IF NOT COALESCE(v_can_shortlist, false) THEN
    RAISE EXCEPTION 'Permission denied: admin role or can_shortlist required';
  END IF;
  UPDATE public.ventures
  SET review_status = p_status
  WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venture not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_application_status(
  p_application_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_owns_job BOOLEAN;
BEGIN
  SELECT COALESCE(p.can_shortlist, false) OR public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')
    OR p.user_type IN ('employer', 'investor')
  INTO v_is_admin
  FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1;
  IF COALESCE(v_is_admin, false) THEN
    NULL;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      WHERE ja.id = p_application_id AND jp.employer_id = auth.uid()
    ) INTO v_owns_job;
    IF NOT v_owns_job THEN
      RAISE EXCEPTION 'Permission denied: you must own the job or be an admin (set can_shortlist=true in profiles if needed)';
    END IF;
  END IF;
  UPDATE public.job_applications SET status = p_status WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
END;
$$;

-- 3. Enable shortlist for ki@gmail.com
UPDATE public.profiles p
SET can_shortlist = true
FROM auth.users u
WHERE p.id = u.id AND u.email = 'ki@gmail.com';
