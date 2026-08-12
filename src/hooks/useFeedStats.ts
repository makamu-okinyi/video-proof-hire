import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useFeedStats(_userId?: string, _isAdmin?: boolean) {
  const stats = useQuery(api.videos.getFeedStats, {});
  const ventureStats = useQuery(api.ventures.getFounderStats, {});

  return {
    data: {
      totalApplications: stats?.myVideos ?? 0,
      activeVentures: ventureStats?.ventures ?? 0,
    },
    isLoading: stats === undefined || ventureStats === undefined,
    error: null,
  };
}
