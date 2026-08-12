import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export type VentureReviewStatus = "pending" | "submitted" | "shortlisted" | "rejected";

export interface AdminVenture {
  id: string;
  name: string;
  tagline: string;
  stage: string;
  industry: string[] | null;
  pitch_video_url: string | null;
  pitch_deck_url: string | null;
  review_status: VentureReviewStatus;
  created_at: string;
  founder_name: string | null;
  founder_id: string | null;
}

function toAdminVenture(v: {
  _id: Id<"ventures">;
  _creationTime: number;
  name: string;
  tagline: string;
  stage: string;
  industry?: string[] | null;
  pitchVideoUrl?: string | null;
  reviewStatus: string;
  founders?: Array<{ userId: string; isLead: boolean }>;
  pitchDecks?: Array<{ fileUrl: string; isCurrentVersion: boolean }>;
}): AdminVenture {
  const leadFounder =
    (v.founders ?? []).find((f) => f.isLead) ?? (v.founders ?? [])[0];
  const currentDeck =
    (v.pitchDecks ?? []).find((d) => d.isCurrentVersion) ??
    (v.pitchDecks ?? [])[0];
  return {
    id: v._id,
    name: v.name,
    tagline: v.tagline,
    stage: v.stage,
    industry: v.industry ?? null,
    pitch_video_url: v.pitchVideoUrl ?? null,
    pitch_deck_url: currentDeck?.fileUrl ?? null,
    review_status: v.reviewStatus as VentureReviewStatus,
    created_at: new Date(v._creationTime).toISOString(),
    founder_name: null,
    founder_id: leadFounder?.userId ?? null,
  };
}

export function useAdminVentures() {
  const allRaw = useQuery(api.ventures.getAllVentures, {});
  const updateStatusMutation = useMutation(api.ventures.updateVentureStatus);

  const allVentures = (allRaw ?? []).map(toAdminVenture);
  const pendingVentures = allVentures.filter(
    (v) => v.review_status === "pending" || v.review_status === "submitted"
  );

  const updateStatus = (
    variables: {
      ventureId: string;
      status: "shortlisted" | "rejected";
      founderId?: string;
      ventureName?: string;
    },
    options?: { onSuccess?: () => void; onError?: () => void }
  ) => {
    updateStatusMutation({
      ventureId: variables.ventureId as Id<"ventures">,
      reviewStatus: variables.status,
    })
      .then(() => {
        toast.success(
          variables.status === "shortlisted"
            ? "Venture shortlisted"
            : "Venture rejected",
          { icon: null }
        );
        options?.onSuccess?.();
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status",
          { icon: null }
        );
        options?.onError?.();
      });
  };

  return {
    pendingVentures,
    allVentures,
    isLoading: allRaw === undefined,
    error: null,
    refetch: () => {},
    updateStatus,
    isUpdating: false,
  };
}
