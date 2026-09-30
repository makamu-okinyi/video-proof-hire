import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Like getAuthUserId, but a suspended account is treated as signed out. Every query and
 * mutation outside the auth plumbing should use this so suspension is enforced server-side.
 * (profiles.getMyProfile / getMyUserId deliberately keep the raw check so the client can
 * tell a suspended user apart from a signed-out one.)
 */
export async function getActiveUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (profile?.status === "suspended") return null;
  return userId;
}
