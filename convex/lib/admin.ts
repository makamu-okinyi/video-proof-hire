import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Server-side admin gate. Every admin-only query/mutation MUST call this first.
 * The role is read from the database on every call - never trusted from the client.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  if (profile?.userType !== "admin") throw new Error("Not authorized");
  return userId;
}

/** Non-throwing variant: is the current session an admin? */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();
  return profile?.userType === "admin";
}

/**
 * Append an entry to the admin audit log. Call from any mutation that performs a
 * privileged action, e.g. `await logAdminAction(ctx, adminId, "venture_status_update", "id -> rejected")`.
 */
export async function logAdminAction(
  ctx: MutationCtx,
  userId: string,
  action: string,
  opts: { userAgent?: string; detail?: string } = {}
): Promise<void> {
  await ctx.db.insert("adminAuditLog", {
    userId,
    action,
    at: Date.now(),
    userAgent: opts.userAgent?.slice(0, 300),
    detail: opts.detail?.slice(0, 500),
  });
}
