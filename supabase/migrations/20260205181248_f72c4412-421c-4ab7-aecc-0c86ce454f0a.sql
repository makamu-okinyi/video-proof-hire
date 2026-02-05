-- Performance indexes for 300+ applications
CREATE INDEX IF NOT EXISTS idx_ventures_stage ON ventures(stage);
CREATE INDEX IF NOT EXISTS idx_ventures_industry ON ventures USING GIN(industry);
CREATE INDEX IF NOT EXISTS idx_venture_scores_total ON venture_scores(total_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ventures_is_active ON ventures(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ventures_created_at ON ventures(created_at DESC);

-- Create pitch-decks storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-decks', 'pitch-decks', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for pitch-decks bucket
CREATE POLICY "Founders can upload pitch decks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pitch-decks' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Founders can view their pitch decks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pitch-decks'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Founders can delete their pitch decks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pitch-decks'
  AND auth.uid() IS NOT NULL
);