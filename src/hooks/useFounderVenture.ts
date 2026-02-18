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

async function fetchFounderVentures(userId: string): Promise<FounderVenture[]> {
  const { data: founderRows, error: founderError } = await supabase
    .from('venture_founders')
    .select('venture_id')
    .eq('user_id', userId)
    .eq('is_lead', true);

  if (founderError || !founderRows?.length) return [];

  const ventureIds = founderRows.map(r => r.venture_id);

  const { data: ventures, error: ventureError } = await supabase
    .from('ventures')
    .select('id, name, stage, review_status, pitch_video_url, created_at')
    .in('id', ventureIds)
    .order('created_at', { ascending: false });

  if (ventureError || !ventures?.length) return [];

  // Batch pitch_deck counts in a single query instead of N+1
  const { data: deckRows } = await supabase
    .from('pitch_decks')
    .select('venture_id')
    .in('venture_id', ventureIds);

  const deckCounts: Record<string, number> = {};
  for (const row of deckRows ?? []) {
    deckCounts[row.venture_id] = (deckCounts[row.venture_id] || 0) + 1;
  }

  return ventures.map(v => ({
    id: v.id,
    name: v.name,
    stage: v.stage,
    review_status: v.review_status || 'submitted',
    pitch_video_url: v.pitch_video_url,
    pitch_deck_count: deckCounts[v.id] ?? 0,
    created_at: v.created_at,
  }));
}

export function useFounderVentures(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['founder-ventures', userId],
    queryFn: () => (userId ? fetchFounderVentures(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const ventureIds = (query.data ?? []).map(v => v.id);

  useEffect(() => {
    if (!ventureIds.length || !userId) return;

    const channel = supabase
      .channel(`founder-ventures-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ventures' }, (payload) => {
        const newRow = payload.new as Record<string, unknown> | null;
        const ventureId = newRow?.id as string | undefined;
        const status = newRow?.review_status as string | undefined;
        if (ventureId && status && ventureIds.includes(ventureId)) {
          queryClient.setQueryData<FounderVenture[]>(['founder-ventures', userId], (prev) => {
            if (!prev) return prev;
            return prev.map(v => v.id === ventureId ? { ...v, review_status: status } : v);
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ventureIds.join(','), userId, queryClient]);

  return query;
}

/** @deprecated Use useFounderVentures (plural) instead */
export function useFounderVenture(userId: string | undefined) {
  const query = useFounderVentures(userId);
  return {
    ...query,
    data: query.data?.[0] ?? null,
  };
}
