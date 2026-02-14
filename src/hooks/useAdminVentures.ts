import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  founder_id: string | null;
}

function mapVentureToAdmin(v: Record<string, unknown>): AdminVenture {
  const founders = (v.venture_founders as Array<Record<string, unknown>>) ?? [];
  const leadFounder = founders.find((f) => f.is_lead) ?? founders[0];
  const profiles = leadFounder?.profiles as Record<string, unknown> | undefined;
  const founderId = leadFounder?.user_id ?? profiles?.id;
  return {
    id: String(v.id ?? ''),
    name: String(v.name ?? ''),
    tagline: String(v.tagline ?? ''),
    stage: String(v.stage ?? ''),
    industry: Array.isArray(v.industry) ? v.industry : null,
    pitch_video_url: v.pitch_video_url ? String(v.pitch_video_url) : null,
    review_status: (v.review_status as VentureReviewStatus) || 'submitted',
    created_at: String(v.created_at ?? ''),
    founder_name: profiles?.username ? String(profiles.username) : null,
    founder_id: founderId ? String(founderId) : null,
  };
}

/** Full query with nested venture_founders -> profiles (FK hint avoids ambiguity when multiple relations exist). */
const ADMIN_VENTURES_SELECT = `
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
`;

async function fetchAdminVentures(): Promise<AdminVenture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select(ADMIN_VENTURES_SELECT)
    .in('review_status', ['pending', 'submitted'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useAdminVentures] fetchAdminVentures error:', error);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((v) => mapVentureToAdmin(v as Record<string, unknown>));
}

async function fetchAllAdminVentures(): Promise<AdminVenture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select(ADMIN_VENTURES_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useAdminVentures] fetchAllAdminVentures error:', error);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((v) => mapVentureToAdmin(v as Record<string, unknown>));
}

/** Fallback: fetch ventures without nested join (no founder names) */
async function fetchAdminVenturesSimple(): Promise<AdminVenture[]> {
  const { data, error } = await supabase
    .from('ventures')
    .select('id, name, tagline, stage, industry, pitch_video_url, review_status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useAdminVentures] fetchAdminVenturesSimple error:', error);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((v) => mapVentureToAdmin({ ...v, venture_founders: [] }));
}

/** Extracts a user-friendly message from Supabase/PostgREST errors (e.g. RLS permission denied) */
function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: string }).message);
    if (msg.includes('permission') || msg.includes('policy') || msg.includes('RLS'))
      return 'Permission denied. Ensure your account has the Admin (employer) role.';
    return msg;
  }
  return 'Failed to update status';
}

async function updateVentureReviewStatus(
  ventureId: string,
  status: 'shortlisted' | 'rejected'
): Promise<void> {
  const { error } = await supabase.rpc('update_venture_review_status', {
    p_venture_id: ventureId,
    p_status: status,
  });

  if (error) {
    console.error('[useAdminVentures] updateVentureReviewStatus error:', error.code, error.message);
    throw error;
  }
}

export function useAdminVentures() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['admin-ventures-pending'],
    queryFn: async () => {
      try {
        const all = await fetchAdminVentures();
        return all;
      } catch (err) {
        console.warn('[useAdminVentures] Full query failed, trying simple fetch:', err);
        const simple = await fetchAdminVenturesSimple();
        return simple.filter((v) => v.review_status === 'pending' || v.review_status === 'submitted');
      }
    },
    refetchInterval: false, // Realtime + optimistic update; polling could overwrite state
    refetchOnWindowFocus: false,
  });

  const allQuery = useQuery({
    queryKey: ['admin-ventures-all'],
    queryFn: async () => {
      try {
        return await fetchAllAdminVentures();
      } catch (err) {
        console.warn('[useAdminVentures] Full query failed, trying simple fetch:', err);
        return fetchAdminVenturesSimple();
      }
    },
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Supabase Realtime: subscribe to ventures changes and apply payload-based cache updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-ventures-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventures' }, (payload) => {
        const newRow = payload.new as Record<string, unknown> | null;
        const ventureId = newRow?.id as string | undefined;
        const reviewStatus = newRow?.review_status as VentureReviewStatus | undefined;

        if (ventureId && (reviewStatus === 'shortlisted' || reviewStatus === 'rejected')) {
          // Immediate local state update: filter venture out of queue
          queryClient.setQueryData(
            ['admin-ventures-pending'],
            (prev: AdminVenture[] | undefined) => (prev ?? []).filter((v) => v.id !== ventureId)
          );
          queryClient.setQueryData(
            ['admin-ventures-all'],
            (prev: AdminVenture[] | undefined) =>
              (prev ?? []).map((v) =>
                v.id === ventureId ? { ...v, review_status: reviewStatus } : v
              )
          );
          // Do NOT invalidate here: refetch can return stale data and overwrite our update.
          // refetchInterval (10s) will eventually sync.
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ ventureId, status }: { ventureId: string; status: 'shortlisted' | 'rejected' }) =>
      updateVentureReviewStatus(ventureId, status),
    onMutate: async ({ ventureId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-ventures-pending'] });
      await queryClient.cancelQueries({ queryKey: ['admin-ventures-all'] });
      const prevPending = queryClient.getQueryData<AdminVenture[]>(['admin-ventures-pending']);
      const prevAll = queryClient.getQueryData<AdminVenture[]>(['admin-ventures-all']);
      queryClient.setQueryData(
        ['admin-ventures-pending'],
        (prev: AdminVenture[] | undefined) => (prev ?? []).filter((v) => v.id !== ventureId)
      );
      queryClient.setQueryData(
        ['admin-ventures-all'],
        (prev: AdminVenture[] | undefined) =>
          (prev ?? []).map((v) => (v.id === ventureId ? { ...v, review_status: status } : v))
      );
      return { prevPending, prevAll };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevPending) queryClient.setQueryData(['admin-ventures-pending'], context.prevPending);
      if (context?.prevAll) queryClient.setQueryData(['admin-ventures-all'], context.prevAll);
    },
    onSuccess: () => {
      // Do NOT invalidate: optimistic update + Realtime keep UI in sync; refetch can overwrite with stale data
    },
  });

  const updateStatus = (
    variables: { ventureId: string; status: 'shortlisted' | 'rejected'; founderId?: string; ventureName?: string },
    options?: { onSuccess?: () => void; onError?: () => void }
  ) => {
    updateStatusMutation.mutate(variables, {
      onSuccess: async () => {
        toast.success(variables.status === 'shortlisted' ? 'Venture shortlisted' : 'Venture rejected', { icon: null });
        if (variables.founderId) {
          supabase.functions.invoke('notify-status-change', {
            body: {
              type: 'venture_status',
              recipientId: variables.founderId,
              status: variables.status,
              data: { ventureId: variables.ventureId, ventureName: variables.ventureName },
            },
          }).catch(console.error);
        }
        options?.onSuccess?.();
      },
      onError: (err) => {
        toast.error(getErrorMessage(err), { icon: null });
        options?.onError?.();
      },
    });
  };

  const pendingVentures = pendingQuery.data ?? [];
  return {
    pendingVentures,
    allVentures: allQuery.data ?? [],
    isLoading: pendingQuery.isLoading || allQuery.isLoading,
    error: pendingQuery.error || allQuery.error,
    refetch: () => {
      pendingQuery.refetch();
      allQuery.refetch();
    },
    updateStatus,
    isUpdating: updateStatusMutation.isPending,
  };
}
