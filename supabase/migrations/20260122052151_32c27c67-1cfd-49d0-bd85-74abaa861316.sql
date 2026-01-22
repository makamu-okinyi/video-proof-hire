-- Add rules to make profiles_public view completely read-only
-- This prevents any INSERT, UPDATE, or DELETE through the view

CREATE OR REPLACE RULE profiles_public_no_insert AS
ON INSERT TO public.profiles_public
DO INSTEAD NOTHING;

CREATE OR REPLACE RULE profiles_public_no_update AS
ON UPDATE TO public.profiles_public
DO INSTEAD NOTHING;

CREATE OR REPLACE RULE profiles_public_no_delete AS
ON DELETE TO public.profiles_public
DO INSTEAD NOTHING;