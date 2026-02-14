-- Bypass RLS for shortlisting via SECURITY DEFINER functions
-- Fixes: "shortlisting reverts after reload" when RLS blocks direct updates

-- 1. Venture shortlisting (Admin Panel)
CREATE OR REPLACE FUNCTION public.update_venture_review_status(
  p_venture_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('shortlisted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: must be shortlisted or rejected';
  END IF;
  IF NOT (public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')) THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;
  UPDATE public.ventures
  SET review_status = p_status
  WHERE id = p_venture_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venture not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_venture_review_status(UUID, TEXT) TO authenticated;

-- 2. Job application shortlisting (Employer or Admin)
-- Admins (employer/investor role OR user_type) can shortlist any job application
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
  v_is_admin := public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('employer', 'investor'));
  IF v_is_admin THEN
    NULL;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      WHERE ja.id = p_application_id AND jp.employer_id = auth.uid()
    ) INTO v_owns_job;
    IF NOT v_owns_job THEN
      RAISE EXCEPTION 'Permission denied: you must own the job or be an admin';
    END IF;
  END IF;
  UPDATE public.job_applications SET status = p_status WHERE id = p_application_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_application_status(UUID, TEXT) TO authenticated;
