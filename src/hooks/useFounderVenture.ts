import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface FounderVenture {
  id: string;
  name: string;
  stage: string;
  review_status: string;
  pitch_video_url: string | null;
  pitch_deck_count: number;
  created_at: string;
}

function toFounderVenture(v: {
  _id: string;
  _creationTime: number;
  name: string;
  stage: string;
  reviewStatus: string;
  pitchVideoUrl?: string | null;
  pitchDeck?: { _id: string } | null;
}): FounderVenture {
  return {
    id: v._id,
    name: v.name,
    stage: v.stage,
    review_status: v.reviewStatus,
    pitch_video_url: v.pitchVideoUrl ?? null,
    pitch_deck_count: v.pitchDeck ? 1 : 0,
    created_at: new Date(v._creationTime).toISOString(),
  };
}

export function useFounderVentures(_userId?: string) {
  const ventures = useQuery(api.ventures.getMyVentures, {});
  return {
    data: (ventures ?? []).map(toFounderVenture),
    isLoading: ventures === undefined,
    error: null,
    refetch: () => {},
  };
}

export function useFounderVenture(_userId?: string) {
  const query = useFounderVentures(_userId);
  return {
    ...query,
    data: query.data?.[0] ?? null,
  };
}
