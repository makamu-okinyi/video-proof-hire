-- =============================================
-- PART 1: EXTEND APP_ROLE ENUM
-- =============================================
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'judge';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'founder';