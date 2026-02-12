-- Add review_status to ventures for Admin Review Panel
-- Supports: pending, submitted (awaiting review), shortlisted (approved), rejected

ALTER TABLE public.ventures
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'submitted'
CHECK (review_status IN ('pending', 'submitted', 'shortlisted', 'rejected'));

-- Index for admin review queue queries
CREATE INDEX IF NOT EXISTS idx_ventures_review_status ON public.ventures(review_status);

-- Admins (employer/investor) can view ALL ventures for review (not just active)
CREATE POLICY "Admins can view all ventures for review"
  ON public.ventures FOR SELECT
  USING (
    public.has_role(auth.uid(), 'employer')
    OR public.has_role(auth.uid(), 'investor')
  );

-- Admins can update review_status (approve/reject)
CREATE POLICY "Admins can update venture review status"
  ON public.ventures FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'employer')
    OR public.has_role(auth.uid(), 'investor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'employer')
    OR public.has_role(auth.uid(), 'investor')
  );
