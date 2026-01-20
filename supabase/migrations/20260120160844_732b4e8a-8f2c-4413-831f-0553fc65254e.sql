-- Add is_private column to videos table
ALTER TABLE public.videos 
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Update RLS policy: Users can view their own videos (including private ones)
-- This policy already exists, no change needed

-- Update the get_public_videos function to exclude private videos
CREATE OR REPLACE FUNCTION public.get_public_videos(page_size integer DEFAULT 20, page_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, video_url text, thumbnail_url text, views integer, likes integer, created_at timestamp with time zone, creator_id uuid, creator_username text, creator_avatar text, creator_is_verified boolean, creator_skills text[], creator_skill_category text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE v.is_private = false
  ORDER BY v.created_at DESC
  LIMIT LEAST(page_size, 100)
  OFFSET page_offset;
$function$;

-- Update get_user_public_videos to only return public videos
CREATE OR REPLACE FUNCTION public.get_user_public_videos(target_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, video_url text, thumbnail_url text, views integer, likes integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE v.user_id = target_user_id AND v.is_private = false
  ORDER BY v.created_at DESC;
$function$;

-- Create function for user to get their own private videos
CREATE OR REPLACE FUNCTION public.get_user_private_videos(target_user_id uuid)
 RETURNS TABLE(id uuid, title text, description text, video_url text, thumbnail_url text, views integer, likes integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND v.is_private = true
    AND v.user_id = auth.uid()  -- Only owner can fetch their private videos
  ORDER BY v.created_at DESC;
$function$;

-- Update videos_public view to exclude private videos
DROP VIEW IF EXISTS public.videos_public;
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
  FROM public.videos
  WHERE is_private = false;