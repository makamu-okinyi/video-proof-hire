-- Enable Realtime for job_applications so applicants see status updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
