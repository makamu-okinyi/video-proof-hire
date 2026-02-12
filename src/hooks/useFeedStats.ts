import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Admin: fetch global venture stats. Founder/talent: fetch only their venture count (0 or 1). */
export function useFeedStats(userId?: string, isAdmin?: boolean) {
  return useQuery({
    queryKey: ['feed-stats', userId ?? 'anon', isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { count: total } = await supabase
          .from('ventures')
          .select('*', { count: 'exact', head: true });
        const { count: active } = await supabase
          .from('ventures')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        return { totalApplications: total ?? 0, activeVentures: active ?? 0 };
      }
      if (userId) {
        const { data: founderRows } = await supabase
          .from('venture_founders')
          .select('venture_id')
          .eq('user_id', userId);
        return { totalApplications: founderRows?.length ?? 0, activeVentures: founderRows?.length ?? 0 };
      }
      return { totalApplications: 0, activeVentures: 0 };
    },
    enabled: !!userId || isAdmin === true,
  });
}
