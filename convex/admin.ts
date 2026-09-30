import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdmin, requireAdmin, logAdminAction } from "./lib/admin";

/** Server-verified: is the current session an admin? Used by the /admin route guard. */
export const amIAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await isAdmin(ctx);
  },
});

/** The signed-in admin's identity for the console header. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAdmin(ctx);
    const uid = ctx.db.normalizeId("users", userId);
    const user = uid ? await ctx.db.get(uid) : null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    return { email: user?.email ?? null, name: profile?.fullName || profile?.username || user?.name || null };
  },
});

/**
 * Called right after an attempt to sign in on /admin/login. Verifies the role on the
 * server and writes the audit trail. Returns { ok: false } for non-admins (and logs
 * the denied attempt) so the client can sign that session out again.
 */
export const recordAdminSignIn = mutation({
  args: {
    method: v.union(v.literal("password"), v.literal("passkey")),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { method, userAgent }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ok: false as const };
    if (!(await isAdmin(ctx))) {
      await logAdminAction(ctx, userId, "sign_in_denied", { userAgent, detail: `not admin (${method})` });
      return { ok: false as const };
    }
    await logAdminAction(ctx, userId, "sign_in", { userAgent, detail: method });
    return { ok: true as const };
  },
});

/** Admin session lifecycle events emitted by the client (e.g. idle sign-out). */
export const logSessionEvent = mutation({
  args: {
    action: v.union(v.literal("idle_signout"), v.literal("sign_out")),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { action, userAgent }) => {
    const adminId = await requireAdmin(ctx);
    await logAdminAction(ctx, adminId, action, { userAgent });
  },
});

/** Most recent audit entries (admin-only). */
export const listAuditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("adminAuditLog")
      .withIndex("by_at")
      .order("desc")
      .take(Math.min(limit ?? 50, 200));
  },
});

// ---------------------------------------------------------------------------
// Admin bootstrap - internal only (NOT callable from the browser). Run with the
// Convex CLI, which authenticates with your deploy key:
//   npx convex run admin:grantAdminByEmail '{"email":"you@example.com"}'
//   npx convex run admin:revokeAdminByEmail '{"email":"you@example.com"}'
// The user must already have signed up (via /auth) so that a `users` row exists.
// ---------------------------------------------------------------------------

export const grantAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .first()
      ?? await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email.trim())).first();
    if (!user) throw new Error(`No user found with email ${email}. Sign up at /auth first.`);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { userType: "admin" });
    } else {
      await ctx.db.insert("profiles", { userId: user._id, userType: "admin" });
    }
    await logAdminAction(ctx, user._id, "admin_granted", { detail: "via CLI" });
    return { userId: user._id };
  },
});

export const revokeAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.trim().toLowerCase()))
      .first()
      ?? await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email.trim())).first();
    if (!user) throw new Error(`No user found with email ${email}`);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing && existing.userType === "admin") {
      await ctx.db.patch(existing._id, { userType: "talent" });
    }
    await logAdminAction(ctx, user._id, "admin_revoked", { detail: "via CLI" });
    return { userId: user._id };
  },
});

/**
 * Make the admin set exactly `emails`: any other admin profile is demoted to "talent". CLI only:
 *   npx convex run admin:restrictAdminsTo '{"emails":["a@x.com","b@y.com"]}'
 * Listed emails that have not signed up yet are reported under `pendingSignup`.
 */
export const restrictAdminsTo = internalMutation({
  args: { emails: v.array(v.string()) },
  handler: async (ctx, { emails }) => {
    const keep = new Set(emails.map((e) => e.trim().toLowerCase()));
    const demoted: string[] = [];
    const admins: string[] = [];
    const profiles = await ctx.db.query("profiles").collect();
    for (const p of profiles) {
      if (p.userType !== "admin") continue;
      const user = await ctx.db.get(p.userId);
      const email = user?.email?.trim().toLowerCase() ?? "";
      if (keep.has(email)) {
        admins.push(email);
      } else {
        await ctx.db.patch(p._id, { userType: "talent" });
        await logAdminAction(ctx, p.userId, "admin_revoked", { detail: "restrictAdminsTo" });
        demoted.push(email || String(p.userId));
      }
    }
    const pendingSignup = [...keep].filter((e) => !admins.includes(e));
    return { demoted, admins, pendingSignup };
  },
});
