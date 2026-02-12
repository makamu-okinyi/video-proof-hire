-- Ensure ventures table has pitch_video_url and review_status (idempotent)
-- Run if migrations were applied out of order or venture_review_status was missed

-- pitch_video_url: from base ventures schema (20260203082418)
ALTER TABLE public.ventures
ADD COLUMN IF NOT EXISTS pitch_video_url TEXT;

-- review_status: from venture_review_status migration (20260212120000)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ventures' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE public.ventures
    ADD COLUMN review_status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (review_status IN ('pending', 'submitted', 'shortlisted', 'rejected'));
    CREATE INDEX IF NOT EXISTS idx_ventures_review_status ON public.ventures(review_status);
  END IF;
END $$;
