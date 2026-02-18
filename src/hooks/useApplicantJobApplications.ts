import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApplicantJobApplication {
  id: string;
  job_id: string;
  status: string;
  cover_message: string | null;
  created_at: string;
  job: {
    id: string;
    title: string;
    company_name: string | null;
  };
}

async function fetchApplicantJobApplications(userId: string | undefined): Promise<ApplicantJobApplication[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      id,
      job_id,
      status,
      cover_message,
      created_at,
      job_postings(id, title, company_name)
    `)
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useApplicantJobApplications] error:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const job = row.job_postings as Record<string, unknown> | Record<string, unknown>[] | null;
    const jobObj = Array.isArray(job) ? job[0] : job;
    return {
      id: row.id,
      job_id: row.job_id,
      status: (row.status as string) || 'pending',
      cover_message: row.cover_message as string | null,
      created_at: row.created_at as string,
      job: jobObj ? { id: jobObj.id, title: jobObj.title, company_name: jobObj.company_name } : { id: row.job_id, title: 'Job', company_name: null },
    };
  });
}

export function useApplicantJobApplications(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['applicant-job-applications', userId],
    queryFn: () => fetchApplicantJobApplications(userId),
    enabled: !!userId,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`applicant-job-applications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_applications',
          filter: `applicant_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row?.id || !row?.status) return;
          const status = row.status as string;
          queryClient.setQueryData<ApplicantJobApplication[]>(
            ['applicant-job-applications', userId],
            (prev) => {
              if (!prev) return prev;
              return prev.map((app) =>
                app.id === row.id ? { ...app, status } : app
              );
            }
          );
          if (status === 'shortlisted') {
            toast.info('Update: Your application has been shortlisted.', { icon: null });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}
