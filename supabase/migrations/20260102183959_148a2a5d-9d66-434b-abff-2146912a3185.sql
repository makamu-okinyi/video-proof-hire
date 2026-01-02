-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- Create storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos
CREATE POLICY "Anyone can view videos"
ON public.videos FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create videos"
ON public.videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
ON public.videos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
ON public.videos FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();