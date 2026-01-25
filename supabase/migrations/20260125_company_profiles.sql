-- =============================================
-- COMPANY PROFILE & ACCOUNT SETTINGS MIGRATION
-- =============================================

-- 1. ADD COMPANY PROFILE FIELDS TO PROFILES TABLE
-- =============================================
DO $$ 
BEGIN
    -- Branding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banner_url') THEN
        ALTER TABLE public.profiles ADD COLUMN banner_url TEXT;
    END IF;
    
    -- Company Identity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'industry') THEN
        ALTER TABLE public.profiles ADD COLUMN industry TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_size') THEN
        ALTER TABLE public.profiles ADD COLUMN company_size TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'about_us') THEN
        ALTER TABLE public.profiles ADD COLUMN about_us TEXT;
    END IF;
    
    -- Online Presence
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website_url') THEN
        ALTER TABLE public.profiles ADD COLUMN website_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE public.profiles ADD COLUMN linkedin_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'twitter_url') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'github_url') THEN
        ALTER TABLE public.profiles ADD COLUMN github_url TEXT;
    END IF;
    
    -- Culture
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'culture_video_url') THEN
        ALTER TABLE public.profiles ADD COLUMN culture_video_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'perks') THEN
        ALTER TABLE public.profiles ADD COLUMN perks TEXT[];
    END IF;
    
    -- Vanity URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'slug') THEN
        ALTER TABLE public.profiles ADD COLUMN slug TEXT UNIQUE;
    END IF;
    
    -- Visibility
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_public') THEN
        ALTER TABLE public.profiles ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    -- Account Settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_new_applicants') THEN
        ALTER TABLE public.profiles ADD COLUMN notify_new_applicants TEXT DEFAULT 'immediate';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_marketing') THEN
        ALTER TABLE public.profiles ADD COLUMN notify_marketing BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug) WHERE slug IS NOT NULL;

-- 2. TEAM MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_email TEXT NOT NULL,
    member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('admin', 'recruiter', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(company_owner_id, member_email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON public.team_members(company_owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(member_user_id);

-- RLS for team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can manage team"
    ON public.team_members FOR ALL
    USING (auth.uid() = company_owner_id);

CREATE POLICY "Team members can view their membership"
    ON public.team_members FOR SELECT
    USING (auth.uid() = member_user_id);

-- 3. FUNCTIONS
-- =============================================

-- Check slug availability
CREATE OR REPLACE FUNCTION public.check_slug_availability(target_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE slug = target_slug AND id != auth.uid()
    );
END;
$$;

-- Update company profile
CREATE OR REPLACE FUNCTION public.update_company_profile(
    p_company_name TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_company_size TEXT DEFAULT NULL,
    p_about_us TEXT DEFAULT NULL,
    p_website_url TEXT DEFAULT NULL,
    p_linkedin_url TEXT DEFAULT NULL,
    p_twitter_url TEXT DEFAULT NULL,
    p_github_url TEXT DEFAULT NULL,
    p_culture_video_url TEXT DEFAULT NULL,
    p_perks TEXT[] DEFAULT NULL,
    p_slug TEXT DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET
        company_name = COALESCE(p_company_name, company_name),
        industry = COALESCE(p_industry, industry),
        company_size = COALESCE(p_company_size, company_size),
        about_us = COALESCE(p_about_us, about_us),
        website_url = COALESCE(p_website_url, website_url),
        linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
        twitter_url = COALESCE(p_twitter_url, twitter_url),
        github_url = COALESCE(p_github_url, github_url),
        culture_video_url = COALESCE(p_culture_video_url, culture_video_url),
        perks = COALESCE(p_perks, perks),
        slug = COALESCE(p_slug, slug),
        is_public = COALESCE(p_is_public, is_public),
        banner_url = COALESCE(p_banner_url, banner_url),
        updated_at = NOW()
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Invite team member
CREATE OR REPLACE FUNCTION public.invite_team_member(
    p_email TEXT,
    p_role TEXT DEFAULT 'recruiter'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.team_members (company_owner_id, member_email, role)
    VALUES (auth.uid(), p_email, p_role)
    ON CONFLICT (company_owner_id, member_email) 
    DO UPDATE SET role = p_role, status = 'pending', invited_at = NOW()
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- Remove team member
CREATE OR REPLACE FUNCTION public.remove_team_member(p_member_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.team_members
    WHERE id = p_member_id AND company_owner_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Get team members
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (
    id UUID,
    member_email TEXT,
    member_user_id UUID,
    role TEXT,
    status TEXT,
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    member_name TEXT,
    member_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id,
        tm.member_email,
        tm.member_user_id,
        tm.role,
        tm.status,
        tm.invited_at,
        tm.accepted_at,
        p.full_name as member_name,
        p.avatar as member_avatar
    FROM public.team_members tm
    LEFT JOIN public.profiles p ON tm.member_user_id = p.id
    WHERE tm.company_owner_id = auth.uid()
    ORDER BY tm.invited_at DESC;
END;
$$;

-- 4. GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.check_slug_availability(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_company_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_team_member(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;
