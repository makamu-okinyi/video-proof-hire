-- Extend pitch deck READ access to judges.
-- Judges review ventures (ventures + scores + tech-blocks) so they need the pitch deck too.
-- Write access (INSERT/DELETE) stays restricted to founders/admins only.

-- ===== TABLE: public.pitch_decks (SELECT) =====
DROP POLICY IF EXISTS "Founders, admins, investors can view pitch decks" ON public.pitch_decks;
CREATE POLICY "Founders, admins, investors, judges can view pitch decks"
ON public.pitch_decks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.venture_founders vf
          WHERE vf.venture_id = pitch_decks.venture_id AND vf.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'investor')
  OR public.has_role(auth.uid(), 'judge')
);

-- ===== STORAGE: pitch-decks bucket (SELECT) =====
DROP POLICY IF EXISTS "Pitch deck files: founders/admins/investors read" ON storage.objects;
CREATE POLICY "Pitch deck files: founders/admins/investors/judges read"
ON storage.objects FOR SELECT USING (
  bucket_id = 'pitch-decks' AND (
    EXISTS (SELECT 1 FROM public.venture_founders vf
            WHERE vf.venture_id::text = (storage.foldername(name))[1] AND vf.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'investor')
    OR public.has_role(auth.uid(), 'judge')
  )
);
