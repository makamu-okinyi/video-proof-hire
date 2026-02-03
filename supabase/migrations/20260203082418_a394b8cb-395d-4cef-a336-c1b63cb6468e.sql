-- =============================================
-- DONJO VENTURE-LIFECYCLE ENGINE SCHEMA
-- Core Entity: Venture Profile
-- =============================================

-- Enum for venture stages
CREATE TYPE venture_stage AS ENUM ('idea', 'prototype', 'mvp', 'growth', 'scale');

-- Enum for intro request status
CREATE TYPE intro_status AS ENUM ('pending', 'founder_approved', 'founder_declined', 'connected');

-- =============================================
-- VENTURES TABLE (Core Entity)
-- =============================================
CREATE TABLE public.ventures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT,
  problem_statement TEXT,
  solution TEXT,
  market_size TEXT,
  traction TEXT,
  business_model TEXT,
  stage venture_stage NOT NULL DEFAULT 'idea',
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  pitch_video_url TEXT,
  pitch_video_thumbnail TEXT,
  
  -- Links
  website_url TEXT,
  github_url TEXT,
  demo_url TEXT,
  
  -- Categorization
  industry TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  
  -- Fundraising
  is_fundraising BOOLEAN DEFAULT false,
  funding_goal INTEGER,
  funding_raised INTEGER DEFAULT 0,
  
  -- Hackathon/Competition
  hackathon_name TEXT,
  hackathon_cohort TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VENTURE FOUNDERS (Many-to-Many with Roles)
-- =============================================
CREATE TABLE public.venture_founders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'co-founder',
  title TEXT,
  equity_percentage DECIMAL(5,2),
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(venture_id, user_id)
);

ALTER TABLE public.venture_founders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERSIONED PITCH DECKS
-- =============================================
CREATE TABLE public.pitch_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  slide_count INTEGER,
  notes TEXT,
  is_current BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_decks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECRET SAUCE - TECHNICAL BLOCKS
-- =============================================
CREATE TABLE public.venture_tech_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  visibility TEXT DEFAULT 'founders_only',
  tech_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.venture_tech_blocks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- EVALUATION SCORING RUBRIC (For Judges)
-- =============================================
CREATE TABLE public.venture_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id),
  
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 10),
  ux_score INTEGER CHECK (ux_score >= 1 AND ux_score <= 10),
  
  total_score DECIMAL(4,2),
  
  feedback TEXT,
  strengths TEXT,
  improvements TEXT,
  
  is_final BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(venture_id, judge_id)
);

ALTER TABLE public.venture_scores ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVESTOR BOOKMARKS (Swipe Interface)
-- =============================================
CREATE TABLE public.investor_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('bookmark', 'pass', 'superlike')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(investor_id, venture_id)
);

ALTER TABLE public.investor_bookmarks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DOUBLE OPT-IN INTRO REQUESTS
-- =============================================
CREATE TABLE public.intro_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID NOT NULL REFERENCES public.profiles(id),
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES public.profiles(id),
  
  status intro_status NOT NULL DEFAULT 'pending',
  
  investor_message TEXT,
  investor_interest TEXT,
  investment_range TEXT,
  
  founder_response TEXT,
  
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HACKATHON COHORTS
-- =============================================
CREATE TABLE public.hackathon_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  demo_day DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hackathon_cohorts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- VENTURES
CREATE POLICY "Public can view active ventures"
  ON public.ventures FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create ventures"
  ON public.ventures FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Founders can update their ventures"
  ON public.ventures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = ventures.id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Lead founders can delete their ventures"
  ON public.ventures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = ventures.id
      AND vf.user_id = auth.uid()
      AND vf.is_lead = true
    )
  );

-- VENTURE FOUNDERS
CREATE POLICY "Anyone can view venture founders"
  ON public.venture_founders FOR SELECT
  USING (true);

CREATE POLICY "Users can add themselves as founders"
  ON public.venture_founders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Lead founders can manage team"
  ON public.venture_founders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_founders.venture_id
      AND vf.user_id = auth.uid()
      AND vf.is_lead = true
    )
  );

CREATE POLICY "Founders can leave ventures"
  ON public.venture_founders FOR DELETE
  USING (user_id = auth.uid());

-- PITCH DECKS
CREATE POLICY "Public can view pitch decks"
  ON public.pitch_decks FOR SELECT
  USING (true);

CREATE POLICY "Founders can add pitch decks"
  ON public.pitch_decks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = pitch_decks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can update pitch decks"
  ON public.pitch_decks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = pitch_decks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can delete pitch decks"
  ON public.pitch_decks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = pitch_decks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

-- TECH BLOCKS
CREATE POLICY "View tech blocks based on visibility"
  ON public.venture_tech_blocks FOR SELECT
  USING (
    visibility = 'public'
    OR (visibility = 'investors_only' AND public.has_role(auth.uid(), 'investor'))
    OR EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_tech_blocks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can add tech blocks"
  ON public.venture_tech_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_tech_blocks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can update tech blocks"
  ON public.venture_tech_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_tech_blocks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

CREATE POLICY "Founders can delete tech blocks"
  ON public.venture_tech_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_tech_blocks.venture_id
      AND vf.user_id = auth.uid()
    )
  );

-- VENTURE SCORES
CREATE POLICY "Judges can score ventures"
  ON public.venture_scores FOR INSERT
  WITH CHECK (
    auth.uid() = judge_id
    AND public.has_role(auth.uid(), 'judge')
  );

CREATE POLICY "Judges can update their scores"
  ON public.venture_scores FOR UPDATE
  USING (auth.uid() = judge_id AND is_final = false);

CREATE POLICY "Founders and judges can view scores"
  ON public.venture_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venture_founders vf
      WHERE vf.venture_id = venture_scores.venture_id
      AND vf.user_id = auth.uid()
    )
    OR auth.uid() = judge_id
    OR public.has_role(auth.uid(), 'judge')
  );

-- INVESTOR BOOKMARKS
CREATE POLICY "Investors manage their bookmarks"
  ON public.investor_bookmarks FOR ALL
  USING (auth.uid() = investor_id);

-- INTRO REQUESTS
CREATE POLICY "Investors can create intro requests"
  ON public.intro_requests FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Participants can view intro requests"
  ON public.intro_requests FOR SELECT
  USING (
    auth.uid() = investor_id
    OR auth.uid() = founder_id
  );

CREATE POLICY "Founders can respond to intro requests"
  ON public.intro_requests FOR UPDATE
  USING (auth.uid() = founder_id);

-- HACKATHON COHORTS
CREATE POLICY "Anyone can view active cohorts"
  ON public.hackathon_cohorts FOR SELECT
  USING (is_active = true);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION calculate_venture_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score := (
    COALESCE(NEW.impact_score, 0) + 
    COALESCE(NEW.feasibility_score, 0) + 
    COALESCE(NEW.innovation_score, 0) + 
    COALESCE(NEW.ux_score, 0)
  )::DECIMAL / 4;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER calculate_score_trigger
  BEFORE INSERT OR UPDATE ON public.venture_scores
  FOR EACH ROW EXECUTE FUNCTION calculate_venture_score();

CREATE TRIGGER update_ventures_updated_at
  BEFORE UPDATE ON public.ventures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tech_blocks_updated_at
  BEFORE UPDATE ON public.venture_tech_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON public.venture_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_ventures_stage ON public.ventures(stage);
CREATE INDEX idx_ventures_featured ON public.ventures(is_featured) WHERE is_featured = true;
CREATE INDEX idx_ventures_fundraising ON public.ventures(is_fundraising) WHERE is_fundraising = true;
CREATE INDEX idx_venture_founders_user ON public.venture_founders(user_id);
CREATE INDEX idx_venture_founders_venture ON public.venture_founders(venture_id);
CREATE INDEX idx_venture_scores_venture ON public.venture_scores(venture_id);
CREATE INDEX idx_investor_bookmarks_investor ON public.investor_bookmarks(investor_id);
CREATE INDEX idx_intro_requests_status ON public.intro_requests(status);