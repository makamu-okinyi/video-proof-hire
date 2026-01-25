-- =============================================
-- RECRUITER ACTION SUITE MIGRATION
-- =============================================

-- 1. ADD SKILL CATEGORY TO VIDEOS TABLE
-- =============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'videos' AND column_name = 'skill_category') THEN
        ALTER TABLE public.videos ADD COLUMN skill_category TEXT DEFAULT 'other';
    END IF;
END $$;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_videos_skill_category ON public.videos(skill_category);

-- 2. SHORTLISTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shortlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recruiter_id, talent_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlists_recruiter_id ON public.shortlists(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_talent_id ON public.shortlists(talent_id);

-- RLS for shortlists
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view their shortlists"
    ON public.shortlists FOR SELECT
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can add to shortlist"
    ON public.shortlists FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can remove from shortlist"
    ON public.shortlists FOR DELETE
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Talent can see who shortlisted them"
    ON public.shortlists FOR SELECT
    USING (auth.uid() = talent_id);

-- 3. HIRING LEADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.hiring_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'interview_scheduled', 'hired')),
    message TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hiring_leads_recruiter_id ON public.hiring_leads(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_hiring_leads_talent_id ON public.hiring_leads(talent_id);
CREATE INDEX IF NOT EXISTS idx_hiring_leads_status ON public.hiring_leads(status);

-- RLS for hiring_leads
ALTER TABLE public.hiring_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view their leads"
    ON public.hiring_leads FOR SELECT
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can create leads"
    ON public.hiring_leads FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their leads"
    ON public.hiring_leads FOR UPDATE
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Talent can view leads sent to them"
    ON public.hiring_leads FOR SELECT
    USING (auth.uid() = talent_id);

CREATE POLICY "Talent can update lead status"
    ON public.hiring_leads FOR UPDATE
    USING (auth.uid() = talent_id);

-- 4. FUNCTIONS FOR SHORTLIST OPERATIONS
-- =============================================

-- Toggle shortlist (add/remove)
CREATE OR REPLACE FUNCTION public.toggle_shortlist(
    target_talent_id UUID,
    target_video_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_id UUID;
    talent_username TEXT;
    recruiter_company TEXT;
BEGIN
    -- Check if already shortlisted
    SELECT id INTO existing_id
    FROM public.shortlists
    WHERE recruiter_id = auth.uid() AND talent_id = target_talent_id;
    
    IF existing_id IS NOT NULL THEN
        -- Remove from shortlist
        DELETE FROM public.shortlists WHERE id = existing_id;
        RETURN false; -- Indicates removed
    ELSE
        -- Add to shortlist
        INSERT INTO public.shortlists (recruiter_id, talent_id, video_id)
        VALUES (auth.uid(), target_talent_id, target_video_id);
        
        -- Get talent username for notification
        SELECT username INTO talent_username
        FROM public.profiles
        WHERE id = target_talent_id;
        
        -- Get recruiter's company name
        SELECT username INTO recruiter_company
        FROM public.profiles
        WHERE id = auth.uid();
        
        -- Create notification for talent
        INSERT INTO public.notifications (user_id, type, title, message, related_user_id, action_url)
        VALUES (
            target_talent_id,
            'match',
            'You''ve been shortlisted!',
            COALESCE(recruiter_company, 'A recruiter') || ' just shortlisted your profile!',
            auth.uid(),
            '/profile'
        );
        
        RETURN true; -- Indicates added
    END IF;
END;
$$;

-- Check if talent is shortlisted
CREATE OR REPLACE FUNCTION public.is_shortlisted(target_talent_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.shortlists
        WHERE recruiter_id = auth.uid() AND talent_id = target_talent_id
    );
END;
$$;

-- Get recruiter's shortlist with talent details
CREATE OR REPLACE FUNCTION public.get_my_shortlist()
RETURNS TABLE (
    id UUID,
    talent_id UUID,
    video_id UUID,
    created_at TIMESTAMPTZ,
    talent_username TEXT,
    talent_avatar TEXT,
    talent_bio TEXT,
    talent_skills TEXT[],
    talent_skill_category TEXT,
    talent_is_verified BOOLEAN,
    video_url TEXT,
    video_thumbnail TEXT,
    video_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.talent_id,
        s.video_id,
        s.created_at,
        p.username as talent_username,
        p.avatar as talent_avatar,
        p.bio as talent_bio,
        p.skills as talent_skills,
        p.skill_category as talent_skill_category,
        p.is_verified as talent_is_verified,
        v.video_url,
        v.thumbnail_url as video_thumbnail,
        v.title as video_title
    FROM public.shortlists s
    JOIN public.profiles p ON s.talent_id = p.id
    LEFT JOIN public.videos v ON s.video_id = v.id
    WHERE s.recruiter_id = auth.uid()
    ORDER BY s.created_at DESC;
END;
$$;

-- 5. FUNCTIONS FOR HIRING LEADS
-- =============================================

-- Create a hiring lead (contact request)
CREATE OR REPLACE FUNCTION public.create_hiring_lead(
    target_talent_id UUID,
    target_video_id UUID DEFAULT NULL,
    lead_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_lead_id UUID;
    talent_username TEXT;
    recruiter_company TEXT;
    existing_lead UUID;
BEGIN
    -- Check if lead already exists
    SELECT id INTO existing_lead
    FROM public.hiring_leads
    WHERE recruiter_id = auth.uid() 
    AND talent_id = target_talent_id
    AND status = 'pending';
    
    IF existing_lead IS NOT NULL THEN
        RETURN existing_lead; -- Return existing pending lead
    END IF;
    
    -- Get recruiter's company name
    SELECT username INTO recruiter_company
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Create the lead
    INSERT INTO public.hiring_leads (recruiter_id, talent_id, video_id, message, company_name)
    VALUES (auth.uid(), target_talent_id, target_video_id, lead_message, recruiter_company)
    RETURNING id INTO new_lead_id;
    
    -- Get talent username
    SELECT username INTO talent_username
    FROM public.profiles
    WHERE id = target_talent_id;
    
    -- Create notification for talent
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id, action_url)
    VALUES (
        target_talent_id,
        'interview',
        'Interview Request!',
        COALESCE(recruiter_company, 'A company') || ' wants to connect with you!',
        auth.uid(),
        '/notifications'
    );
    
    RETURN new_lead_id;
END;
$$;

-- Update lead status (for talent to accept/decline)
CREATE OR REPLACE FUNCTION public.update_lead_status(
    lead_id UUID,
    new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_record RECORD;
BEGIN
    -- Get the lead
    SELECT * INTO lead_record
    FROM public.hiring_leads
    WHERE id = lead_id AND talent_id = auth.uid();
    
    IF lead_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update status
    UPDATE public.hiring_leads
    SET status = new_status, updated_at = NOW()
    WHERE id = lead_id;
    
    -- Notify recruiter of response
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id)
    VALUES (
        lead_record.recruiter_id,
        CASE WHEN new_status = 'accepted' THEN 'match' ELSE 'view' END,
        CASE WHEN new_status = 'accepted' THEN 'Lead Accepted!' ELSE 'Lead Update' END,
        'Your hiring lead has been ' || new_status,
        auth.uid()
    );
    
    -- If accepted, create a conversation
    IF new_status = 'accepted' THEN
        INSERT INTO public.conversations (employer_id, candidate_id)
        VALUES (lead_record.recruiter_id, auth.uid())
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN true;
END;
$$;

-- Get leads for talent
CREATE OR REPLACE FUNCTION public.get_my_leads()
RETURNS TABLE (
    id UUID,
    recruiter_id UUID,
    video_id UUID,
    status TEXT,
    message TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ,
    recruiter_username TEXT,
    recruiter_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hl.id,
        hl.recruiter_id,
        hl.video_id,
        hl.status,
        hl.message,
        hl.company_name,
        hl.created_at,
        p.username as recruiter_username,
        p.avatar as recruiter_avatar
    FROM public.hiring_leads hl
    JOIN public.profiles p ON hl.recruiter_id = p.id
    WHERE hl.talent_id = auth.uid()
    ORDER BY hl.created_at DESC;
END;
$$;

-- 6. UPDATE get_public_videos TO INCLUDE CATEGORY
-- =============================================
CREATE OR REPLACE FUNCTION public.get_public_videos(
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    video_url TEXT,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    views INTEGER,
    likes INTEGER,
    skill_category TEXT,
    created_at TIMESTAMPTZ,
    creator_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    creator_is_verified BOOLEAN,
    creator_skills TEXT[],
    creator_skill_category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.video_url,
        v.thumbnail_url,
        v.title,
        v.description,
        v.views,
        v.likes,
        v.skill_category,
        v.created_at,
        p.id as creator_id,
        p.username as creator_username,
        p.avatar as creator_avatar,
        p.is_verified as creator_is_verified,
        p.skills as creator_skills,
        p.skill_category as creator_skill_category
    FROM public.videos v
    JOIN public.profiles p ON v.user_id = p.id
    WHERE v.is_private = false
    AND (category_filter IS NULL OR v.skill_category = category_filter)
    ORDER BY v.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$;

-- 7. GRANT PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.toggle_shortlist(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shortlisted(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_shortlist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_hiring_lead(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_leads() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_videos(INTEGER, INTEGER, TEXT) TO authenticated, anon;
