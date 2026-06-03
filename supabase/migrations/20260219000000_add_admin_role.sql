-- Add a dedicated, vetted 'admin' role. Must be its own migration: a new enum
-- value cannot be USED in the same transaction it is added.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
