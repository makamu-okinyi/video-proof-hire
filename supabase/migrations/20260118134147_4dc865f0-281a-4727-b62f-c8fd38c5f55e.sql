-- Fix 1: Add pagination support to get_public_videos function
DROP FUNCTION IF EXISTS public.get_public_videos();

CREATE OR REPLACE FUNCTION public.get_public_videos(
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  views integer,
  likes integer,
  created_at timestamp with time zone,
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
SET search_path TO 'public'
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
  ORDER BY v.created_at DESC
  LIMIT LEAST(page_size, 100)  -- Cap at 100 to prevent abuse
  OFFSET page_offset;
$$;

-- Fix 2: Add length constraints to job_postings table
ALTER TABLE public.job_postings
  ADD CONSTRAINT job_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT job_description_length CHECK (length(description) <= 10000),
  ADD CONSTRAINT job_location_length CHECK (location IS NULL OR length(location) <= 200),
  ADD CONSTRAINT job_company_name_length CHECK (company_name IS NULL OR length(company_name) <= 200),
  ADD CONSTRAINT job_company_logo_length CHECK (company_logo IS NULL OR length(company_logo) <= 500);

-- Fix 3: Add length constraints to challenges table
ALTER TABLE public.challenges
  ADD CONSTRAINT challenge_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT challenge_description_length CHECK (length(description) <= 10000),
  ADD CONSTRAINT challenge_prize_description_length CHECK (prize_description IS NULL OR length(prize_description) <= 500);

-- Fix 4: Add length constraint to job_applications table
ALTER TABLE public.job_applications
  ADD CONSTRAINT cover_message_length CHECK (cover_message IS NULL OR length(cover_message) <= 500);

-- Fix 5: Add length constraints to messages table
ALTER TABLE public.messages
  ADD CONSTRAINT message_content_length CHECK (length(content) <= 5000);

-- Fix 6: Add index for pagination performance
CREATE INDEX IF NOT EXISTS idx_videos_created_at_desc ON public.videos(created_at DESC);