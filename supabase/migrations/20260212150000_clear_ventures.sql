-- Clear all ventures and related data for a fresh start
-- CASCADE will remove: venture_founders, pitch_decks, venture_tech_blocks,
-- venture_scores, investor_bookmarks, intro_requests

TRUNCATE TABLE public.ventures CASCADE;
