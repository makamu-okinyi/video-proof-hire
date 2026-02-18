-- Add video_prompt column to job_postings and challenges
-- Allows employers to specify what the video pitch should contain

ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS video_prompt text;

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS video_prompt text;
