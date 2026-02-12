import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VentureReviewStatus = 'pending' | 'submitted' | 'shortlisted' | 'rejected';

export interface AdminVenture {
  id: string;
  name: string;
  tagline: string;
  stage: string;
  industry: string[] | null;
  pitch_video_url: string | null;
  review_status: VentureReviewStatus;
  created_at: string;
  founder_name: string | null;
}

function mapVentureToAdmin(v: any): AdminVenture {
  const founders = v.venture_founders || [];
  const leadFounder = founders.find((f: any) => f.is_lead) || founders[0];
  return {
    id: v.id,
    name: v.name,
    tagline: v.tagline,
    stage: v.stage,
    industry: v.industry,
    pitch_video_url: v.pitch_video_url,
    review_status: (v.review_status || 'submitted') as VentureReviewStatus,
    created_at: v.created_at,
    founder_name: leadFounder?.profiles?.username ?? null,
  };
}

async function fetchAdminVentures(): Promise<AdminVenture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select(`
      id,
      name,
      tagline,
      stage,
      industry,
      pitch_video_url,
      review_status,
      created_at,
      venture_founders(
        is_lead,
        profiles(id, username)
      )
    `)
    .in('review_status', ['pending', 'submitted'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapVentureToAdmin);
}

async function fetchAllAdminVentures(): Promise<AdminVenture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select(`
      id,
      name,
      tagline,
      stage,
      industry,
      pitch_video_url,
      review_status,
      created_at,
      venture_founders(
        is_lead,
        profiles(id, username)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapVentureToAdmin);
}

async function updateVentureReviewStatus(
  ventureId: string,
  status: 'shortlisted' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('ventures')
    .update({ review_status: status })
    .eq('id', ventureId);

  if (error) throw error;
}

export function useAdminVentures() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['admin-ventures-pending'],
    queryFn: fetchAdminVentures,
  });

  const allQuery = useQuery({
    queryKey: ['admin-ventures-all'],
    queryFn: fetchAllAdminVentures,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ventureId, status }: { ventureId: string; status: 'shortlisted' | 'rejected' }) =>
      updateVentureReviewStatus(ventureId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ventures-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ventures-all'] });
    },
  });

  return {
    pendingVentures: pendingQuery.data ?? [],
    allVentures: allQuery.data ?? [],
    isLoading: pendingQuery.isLoading || allQuery.isLoading,
    error: pendingQuery.error || allQuery.error,
    refetch: () => {
      pendingQuery.refetch();
      allQuery.refetch();
    },
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
