-- #2 Scope pitch deck access (trustworthy now that roles are vetted).
-- Read  = venture founders OR admin OR investor.  Write = venture founders OR admin.
-- Storage objects are keyed "<venture_id>/<ts>.<ext>" (usePitchDeckUpload.ts),
-- so (storage.foldername(name))[1] = venture_id.

-- ===== TABLE: public.pitch_decks (SELECT) =====
DROP POLICY IF EXISTS "Public can view pitch decks" ON public.pitch_decks;
DROP POLICY IF EXISTS "Founders, admins, investors can view pitch decks" ON public.pitch_decks;
CREATE POLICY "Founders, admins, investors can view pitch decks"
ON public.pitch_decks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.venture_founders vf
          WHERE vf.venture_id = pitch_decks.venture_id AND vf.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'investor')
);

-- ===== STORAGE: pitch-decks bucket (SELECT) =====
DROP POLICY IF EXISTS "Founders can view their pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Pitch deck files: founders/admins/investors read" ON storage.objects;
CREATE POLICY "Pitch deck files: founders/admins/investors read"
ON storage.objects FOR SELECT USING (
  bucket_id = 'pitch-decks' AND (
    EXISTS (SELECT 1 FROM public.venture_founders vf
            WHERE vf.venture_id::text = (storage.foldername(name))[1] AND vf.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'investor')
  )
);

-- ===== STORAGE: pitch-decks bucket (INSERT) — founders/admins only =====
DROP POLICY IF EXISTS "Founders can upload pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Pitch deck files: founders/admins upload" ON storage.objects;
CREATE POLICY "Pitch deck files: founders/admins upload"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pitch-decks' AND (
    EXISTS (SELECT 1 FROM public.venture_founders vf
            WHERE vf.venture_id::text = (storage.foldername(name))[1] AND vf.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- ===== STORAGE: pitch-decks bucket (DELETE) — founders/admins only =====
DROP POLICY IF EXISTS "Founders can delete their pitch decks" ON storage.objects;
DROP POLICY IF EXISTS "Pitch deck files: founders/admins delete" ON storage.objects;
CREATE POLICY "Pitch deck files: founders/admins delete"
ON storage.objects FOR DELETE USING (
  bucket_id = 'pitch-decks' AND (
    EXISTS (SELECT 1 FROM public.venture_founders vf
            WHERE vf.venture_id::text = (storage.foldername(name))[1] AND vf.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
