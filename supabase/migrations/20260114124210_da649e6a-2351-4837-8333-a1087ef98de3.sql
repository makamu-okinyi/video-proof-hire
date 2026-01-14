-- Drop existing SELECT policies on job_applications
DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON public.job_applications;

-- Recreate as PERMISSIVE policies (default) so either condition grants access
CREATE POLICY "Applicants can view their own applications"
  ON public.job_applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Employers can view applications to their jobs"
  ON public.job_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings
      WHERE job_postings.id = job_applications.job_id
        AND job_postings.employer_id = auth.uid()
    )
  );