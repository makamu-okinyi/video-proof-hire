import { useQuery } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['founder-venture', userId],
    queryFn: () => (userId ? fetchFounderVenture(userId) : Promise.resolve(null)),
    enabled: !!userId,
  });
}
