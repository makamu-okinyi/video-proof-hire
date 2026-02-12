-- Run this in Supabase SQL Editor to clear all ventures and start fresh
-- Deletes ventures and cascades to: venture_founders, pitch_decks, venture_tech_blocks,
-- venture_scores, investor_bookmarks, intro_requests

TRUNCATE TABLE public.ventures CASCADE;
