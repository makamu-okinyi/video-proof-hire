import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployerAnalytics {
  activeJobs: number;
  totalApplicants: number;
  challenges: number;
}

/** Fetches analytics for job_postings where employer_id matches auth user.
 * employer_id in job_postings references profiles(id); profiles.id = auth.users.id. */
async function fetchEmployerAnalytics(employerId: string | undefined): Promise<EmployerAnalytics> {
  if (!employerId) return { activeJobs: 0, totalApplicants: 0, challenges: 0 };

  const { count: jobsCount, error: jobsError } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId)
    .eq('is_active', true);

  const { data: employerJobs, error: jobsDataError } = await supabase
    .from('job_postings')
    .select('id')
    .eq('employer_id', employerId);
  const jobIds = employerJobs?.map((j) => j.id) ?? [];
  let applicantsCount = 0;
  if (jobIds.length > 0) {
    const { count } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .in('job_id', jobIds);
    applicantsCount = count ?? 0;
  }

  const { count: challengesCount } = await supabase
    .from('challenges')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', employerId)
    .eq('is_active', true);

  return {
    activeJobs: jobsCount ?? 0,
    totalApplicants: applicantsCount,
    challenges: challengesCount ?? 0,
  };
}

export function useEmployerAnalytics(employerId: string | undefined) {
  return useQuery({
    queryKey: ['employer-analytics', employerId],
    queryFn: () => fetchEmployerAnalytics(employerId),
    enabled: !!employerId,
    staleTime: 30_000,
  });
}
