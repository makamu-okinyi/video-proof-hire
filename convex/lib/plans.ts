import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export type LimitKey = "activeJobs" | "activeChallenges" | "shortlistSize" | "seats";

const LABELS: Record<LimitKey, string> = {
  activeJobs: "active job posts",
  activeChallenges: "active challenges",
  shortlistSize: "shortlisted candidates",
  seats: "team seats",
};

/** The plan an employer is on (default slug "free"), or null when that plan is not defined. */
export async function getEmployerPlan(ctx: QueryCtx | MutationCtx, userId: string) {
  const emp = await ctx.db
    .query("employerProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  const slug = emp?.planSlug ?? "free";
  const plan = await ctx.db
    .query("plans")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();
  return { slug, plan };
}

/**
 * Throws a user-facing ConvexError when `currentCount` already meets the plan limit.
 * No plan document (or no limit set for the key) means unlimited.
 */
export async function assertWithinPlan(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  key: LimitKey,
  currentCount: number
) {
  const { plan } = await getEmployerPlan(ctx, userId);
  const limit = plan?.limits[key];
  if (plan && limit !== undefined && limit !== null && currentCount >= limit) {
    throw new ConvexError(
      `Your ${plan.name} plan allows up to ${limit} ${LABELS[key]}. Contact Donjo to raise your limit.`
    );
  }
}
