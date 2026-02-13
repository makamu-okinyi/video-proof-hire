import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FounderVenture {
  id: string;
  name: string;
  stage: string;
  review_status: string;
  pitch_video_url: string | null;
  pitch_deck_count: number;
  created_at: string;
}

async function fetchFounderVenture(userId: string): Promise<FounderVenture | null> {
  const { data: founderRows, error: founderError } = await supabase
    .from('venture_founders')
    .select('venture_id')
    .eq('user_id', userId)
    .eq('is_lead', true)
    .limit(1);

  if (founderError || !founderRows?.length) return null;

  const ventureId = founderRows[0].venture_id;

  const { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .select('id, name, stage, review_status, pitch_video_url, created_at')
    .eq('id', ventureId)
    .single();

  if (ventureError || !venture) return null;

  const { count } = await supabase
    .from('pitch_decks')
    .select('*', { count: 'exact', head: true })
    .eq('venture_id', ventureId);

  return {
    id: venture.id,
    name: venture.name,
    stage: venture.stage,
    review_status: venture.review_status || 'submitted',
    pitch_video_url: venture.pitch_video_url,
    pitch_deck_count: count ?? 0,
    created_at: venture.created_at,
  };
}

export function useFounderVenture(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['founder-venture', userId],
    queryFn: () => (userId ? fetchFounderVenture(userId) : Promise.resolve(null)),
    enabled: !!userId,
    refetchInterval: 5000, // Poll every 5s as backup for Admin status updates
  });

  const ventureId = query.data?.id;

  useEffect(() => {
    if (!ventureId || !userId) return;
    const channel = supabase
      .channel(`founder-venture-${ventureId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ventures', filter: `id=eq.${ventureId}` }, (payload) => {
        const newRow = payload.new as Record<string, unknown> | null;
        const status = newRow?.review_status as string | undefined;
        if (status === 'shortlisted' || status === 'rejected') {
          queryClient.setQueryData(['founder-venture', userId], (prev: FounderVenture | null | undefined) => {
            if (!prev || prev.id !== ventureId) return prev;
            return { ...prev, review_status: status };
          });
          // Do NOT invalidate: refetch could overwrite with stale data. refetchInterval (5s) syncs.
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ventureId, userId, queryClient]);

  return query;
}
