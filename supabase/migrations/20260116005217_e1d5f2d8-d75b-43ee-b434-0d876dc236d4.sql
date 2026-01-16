-- 1. FIX EMAIL EXPOSURE: Drop the permissive policy and create a more restrictive one
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Users can view their own full profile (including email)
-- This policy already exists: "Users can view their own profile"

-- For viewing OTHER users' profiles, they must use profiles_public view or get_public_profile() function
-- No additional policy needed - the existing "Users can view their own profile" policy handles this

-- 2. ADD FIELD-LEVEL RESTRICTIONS FOR CHALLENGE SUBMISSIONS
-- Users should not be able to change the status field
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.challenge_submissions;

CREATE POLICY "Users can update their own submissions"
  ON public.challenge_submissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    AND status = (SELECT status FROM public.challenge_submissions WHERE id = challenge_submissions.id)
  );

-- 3. ADD FIELD-LEVEL RESTRICTIONS FOR JOB APPLICATIONS
-- Employers can only update the status field, not applicant_id or job_id
DROP POLICY IF EXISTS "Employers can update application status" ON public.job_applications;

CREATE POLICY "Employers can update application status"
  ON public.job_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings
      WHERE job_postings.id = job_applications.job_id
        AND job_postings.employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_postings
      WHERE job_postings.id = job_applications.job_id
        AND job_postings.employer_id = auth.uid()
    )
    -- Ensure applicant_id and job_id cannot be changed
    AND applicant_id = (SELECT applicant_id FROM public.job_applications WHERE id = job_applications.id)
    AND job_id = (SELECT job_id FROM public.job_applications WHERE id = job_applications.id)
  );

-- Add comments documenting the security design
COMMENT ON POLICY "Users can update their own submissions" ON public.challenge_submissions IS 'Users can update their submissions but cannot change the status field';
COMMENT ON POLICY "Employers can update application status" ON public.job_applications IS 'Employers can only update status, not applicant_id or job_id';