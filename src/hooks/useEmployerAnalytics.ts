import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployerAnalytics {
  activeJobs: number;
  totalApplicants: number;
  challenges: number;
}

async function fetchEmployerAnalytics(employerId: string | undefined): Promise<EmployerAnalytics> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b7445b92-2b1f-49fa-93e9-b6a4f91b1bfc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEmployerAnalytics:fetch',message:'fetchEmployerAnalytics called',data:{employerId:employerId||'undefined',hasEmployerId:!!employerId},timestamp:Date.now(),hypothesisId:'G'})}).catch(()=>{});
  // #endregion
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

  const result = {
    activeJobs: jobsCount ?? 0,
    totalApplicants: applicantsCount,
    challenges: challengesCount ?? 0,
  };
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b7445b92-2b1f-49fa-93e9-b6a4f91b1bfc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useEmployerAnalytics:result',message:'analytics result',data:{employerId,result,jobIdsLength:jobIds.length,jobsError:jobsError?.message},timestamp:Date.now(),hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  return result;
}

export function useEmployerAnalytics(employerId: string | undefined) {
  return useQuery({
    queryKey: ['employer-analytics', employerId],
    queryFn: () => fetchEmployerAnalytics(employerId),
    enabled: !!employerId,
  });
}
