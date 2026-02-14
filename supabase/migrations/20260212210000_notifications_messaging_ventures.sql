-- Notifications: add pitch/job review types and related_venture_id
-- Conversations: support admin-founder (venture) chats and auto-messages

-- 1. Extend notifications type and add related_venture_id
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS related_venture_id UUID REFERENCES public.ventures(id) ON DELETE SET NULL;

ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'view', 'like', 'comment', 'match', 'interview', 'application', 
    'message', 'follow', 'pitch_shortlisted', 'pitch_rejected', 
    'job_shortlisted', 'job_rejected'
  ));

-- 2. Conversations: add venture_id for admin-founder chats
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS venture_id UUID REFERENCES public.ventures(id) ON DELETE SET NULL;

-- Drop old unique constraint
ALTER TABLE public.conversations 
  DROP CONSTRAINT IF EXISTS conversations_employer_id_candidate_id_job_application_id_key;

-- New unique: (employer_id, candidate_id, job_application_id, venture_id) - one convo per job OR per venture
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique 
  ON public.conversations (employer_id, candidate_id, COALESCE(job_application_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(venture_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Allow venture conversations: employer=admin, candidate=founder, job_application_id=null
DROP POLICY IF EXISTS "Employers can create conversations with shortlisted candidates" ON public.conversations;

CREATE POLICY "Employers can create conversations with shortlisted candidates"
ON public.conversations FOR INSERT
WITH CHECK (
  auth.uid() = employer_id
  AND (
    -- Job flow: must have shortlisted job application
    (job_application_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM job_applications
      WHERE job_applications.id = job_application_id
      AND job_applications.status = 'shortlisted'
    ))
    -- Venture flow: admin can message founder (employer/investor role or can_shortlist)
    OR (venture_id IS NOT NULL AND job_application_id IS NULL AND (
      public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND (p.can_shortlist = true OR p.user_type IN ('employer', 'investor')))
    ) AND EXISTS (
      SELECT 1 FROM venture_founders vf WHERE vf.venture_id = venture_id AND vf.user_id = candidate_id
    ))
  )
);
