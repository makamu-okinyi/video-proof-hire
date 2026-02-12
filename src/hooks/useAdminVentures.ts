import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Venture applications are stored in the `ventures` table (not a separate applications table). */

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

  if (error) {
    console.error('[useAdminVentures] fetchAdminVentures error:', error);
    throw error;
  }

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

  if (error) {
    console.error('[useAdminVentures] fetchAllAdminVentures error:', error);
    throw error;
  }

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
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
  });

  const allQuery = useQuery({
    queryKey: ['admin-ventures-all'],
    queryFn: fetchAllAdminVentures,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Supabase Realtime: refetch immediately when ventures change
  useEffect(() => {
    const channel = supabase
      .channel('admin-ventures-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventures' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-ventures-pending'] });
        queryClient.invalidateQueries({ queryKey: ['admin-ventures-all'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
