-- Create job postings table for employers
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  job_type TEXT NOT NULL DEFAULT 'full-time', -- full-time, part-time, contract, internship
  experience_level TEXT DEFAULT 'entry', -- entry, mid, senior, lead
  skills_required TEXT[] DEFAULT '{}',
  company_name TEXT,
  company_logo TEXT,
  benefits TEXT[] DEFAULT '{}',
  application_deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INTEGER NOT NULL DEFAULT 0,
  applications_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenges/competitions table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_description TEXT,
  prize_amount INTEGER,
  skills_tags TEXT[] DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  participants_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge submissions table
CREATE TABLE public.challenge_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, reviewed, winner
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, shortlisted, rejected
  cover_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job postings policies
CREATE POLICY "Anyone can view active job postings" ON public.job_postings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can create job postings" ON public.job_postings
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own job postings" ON public.job_postings
  FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own job postings" ON public.job_postings
  FOR DELETE USING (auth.uid() = employer_id);

-- Challenges policies  
CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Employers can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update their own challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete their own challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = employer_id);

-- Challenge submissions policies
CREATE POLICY "Users can view their own submissions" ON public.challenge_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employers can view submissions to their challenges" ON public.challenge_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenges 
      WHERE id = challenge_id AND employer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can submit to challenges" ON public.challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job applications policies
CREATE POLICY "Applicants can view their own applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Employers can view applications to their jobs" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_postings 
      WHERE id = job_id AND employer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can apply to jobs" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Employers can update application status" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.job_postings 
      WHERE id = job_id AND employer_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();