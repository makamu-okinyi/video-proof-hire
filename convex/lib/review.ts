import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { logAdminAction } from "./admin";
import { pushNotification } from "./notify";

export const REVIEW_STATUSES = ["submitted", "shortlisted", "rejected"] as const;

/**
 * Apply a review decision to a venture: updates status, reviewer bookkeeping and the
 * append-only statusHistory (which powers the velocity analytics), and writes the audit log.
 * Rejections require a reason.
 */
export async function applyVentureReview(
  ctx: MutationCtx,
  adminId: string,
  ventureId: Id<"ventures">,
  status: string,
  opts: { reason?: string; notes?: string; score?: number } = {}
) {
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid review status");
  const venture = await ctx.db.get(ventureId);
  if (!venture) throw new Error("Venture not found");
  const reason = opts.reason?.trim().slice(0, 1000);
  if (status === "rejected" && !reason) throw new Error("A reason is required to reject a venture");
  if (opts.score !== undefined && (opts.score < 0 || opts.score > 10)) throw new Error("Score must be between 0 and 10");

  const now = Date.now();
  const history = venture.statusHistory ?? [
    // Legacy rows: reconstruct the initial submission from the creation time.
    { status: "submitted", at: venture._creationTime },
  ];
  const changed = venture.reviewStatus !== status;
  await ctx.db.patch(ventureId, {
    reviewStatus: status,
    reviewedAt: status === "submitted" ? undefined : now,
    reviewedBy: status === "submitted" ? undefined : adminId,
    reviewReason: status === "rejected" ? reason : undefined,
    ...(opts.notes !== undefined ? { reviewNotes: opts.notes.trim().slice(0, 4000) } : {}),
    ...(opts.score !== undefined ? { reviewScore: opts.score } : {}),
    statusHistory: changed ? [...history, { status, at: now, by: adminId, ...(reason ? { reason } : {}) }] : history,
  });
  await logAdminAction(ctx, adminId, "venture_review", {
    detail: `${venture.name} (${ventureId}): ${venture.reviewStatus} -> ${status}${reason ? ` - ${reason}` : ""}`,
  });
  if (changed && (status === "shortlisted" || status === "rejected")) {
    const founders = await ctx.db
      .query("ventureFounders")
      .withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId))
      .collect();
    for (const f of founders) {
      if (f.userId === adminId) continue;
      await pushNotification(ctx, {
        userId: f.userId,
        type: status === "shortlisted" ? "pitch_shortlisted" : "pitch_rejected",
        title: `Pitch ${status}`,
        message: `${venture.name} has been ${status} by the review team.`,
        actionUrl: "/founder",
        relatedUserId: adminId,
      });
    }
  }
}
