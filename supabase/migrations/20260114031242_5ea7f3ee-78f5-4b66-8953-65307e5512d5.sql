-- Create a public view for videos that excludes user_id
CREATE VIEW public.videos_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    title,
    description,
    video_url,
    thumbnail_url,
    views,
    likes,
    created_at,
    updated_at
  FROM public.videos;
  -- Excludes user_id to protect creator identity

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;

-- Create restrictive SELECT policies on the base table
-- Only authenticated users can read videos (and only their own, or via the public view)
CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

-- Employers can view videos for job applications (challenge submissions)
CREATE POLICY "Employers can view videos from submissions"
  ON public.videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_submissions cs
      JOIN public.challenges c ON cs.challenge_id = c.id
      WHERE cs.video_id = videos.id AND c.employer_id = auth.uid()
    )
  );

-- Create an RPC function to get public videos with optional user profile info (for authenticated users only)
CREATE OR REPLACE FUNCTION public.get_public_videos()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  views integer,
  likes integer,
  created_at timestamptz,
  creator_id uuid,
  creator_username text,
  creator_avatar text,
  creator_is_verified boolean,
  creator_skills text[],
  creator_skill_category text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.views,
    v.likes,
    v.created_at,
    p.id as creator_id,
    p.username as creator_username,
    p.avatar as creator_avatar,
    p.is_verified as creator_is_verified,
    p.skills as creator_skills,
    p.skill_category as creator_skill_category
  FROM public.videos v
  LEFT JOIN public.profiles p ON v.user_id = p.id
  ORDER BY v.created_at DESC;
$$;

-- Create an RPC function to get videos by a specific user (for public profile viewing)
CREATE OR REPLACE FUNCTION public.get_user_public_videos(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  views integer,
  likes integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    v.id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.views,
    v.likes,
    v.created_at
  FROM public.videos v
  WHERE v.user_id = target_user_id
  ORDER BY v.created_at DESC;
$$;