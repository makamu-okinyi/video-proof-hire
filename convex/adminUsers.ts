import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAdmin, logAdminAction } from "./lib/admin";
import { getEmployerPlan } from "./lib/plans";

const ROLES = ["talent", "employer", "founder", "investor", "judge"] as const;
const LIST_CAP = 1000;

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, profiles] = await Promise.all([
      ctx.db.query("users").order("desc").take(LIST_CAP + 1),
      ctx.db.query("profiles").take(LIST_CAP * 2),
    ]);
    const byUser = new Map(profiles.map((p) => [p.userId, p]));
    const rows = users.slice(0, LIST_CAP).map((u) => {
      const p = byUser.get(u._id);
      return {
        id: u._id,
        email: u.email ?? null,
        name: p?.fullName || p?.username || u.name || null,
        username: p?.username ?? null,
        role: p?.userType ?? "unassigned",
        status: p?.status ?? "active",
        county: p?.county ?? null,
        country: p?.country ?? null,
        createdAt: u._creationTime,
        lastSeenAt: p?.lastSeenAt ?? null,
      };
    });
    return { rows, capped: users.length > LIST_CAP };
  },
});

export const detail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    const [passkeys, videos, applications, jobs, founderRows, submissions, sessions, adminLogins] = await Promise.all([
      ctx.db.query("passkeys").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("jobApplications").withIndex("by_applicantId", (q) => q.eq("applicantId", userId)).collect(),
      ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
      ctx.db.query("ventureFounders").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("challengeSubmissions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect(),
      profile?.userType === "admin"
        ? ctx.db.query("adminAuditLog").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(20)
        : Promise.resolve([]),
    ]);
    const plan = profile?.userType === "employer" ? (await getEmployerPlan(ctx, userId)).slug : null;
    return {
      id: user._id,
      email: user.email ?? null,
      createdAt: user._creationTime,
      profile: profile
        ? {
            username: profile.username ?? null,
            fullName: profile.fullName ?? null,
            role: profile.userType ?? "unassigned",
            status: profile.status ?? "active",
            suspendedReason: profile.suspendedReason ?? null,
            suspendedAt: profile.suspendedAt ?? null,
            county: profile.county ?? null,
            country: profile.country ?? null,
            companyName: profile.companyName ?? null,
            skillCategory: profile.skillCategory ?? null,
            lastSeenAt: profile.lastSeenAt ?? null,
          }
        : null,
      counts: {
        videos: videos.length,
        applications: applications.length,
        jobPosts: jobs.length,
        ventures: founderRows.length,
        challengeSubmissions: submissions.length,
        passkeys: passkeys.length,
        activeSessions: sessions.length,
      },
      plan,
      lastAdminSignIn: adminLogins.find((l) => l.action === "sign_in")?.at ?? null,
    };
  },
});

async function profileFor(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
}

export const setRole = mutation({
  args: { userId: v.id("users"), role: v.string() },
  handler: async (ctx, { userId, role }) => {
    const adminId = await requireAdmin(ctx);
    if (!(ROLES as readonly string[]).includes(role)) throw new Error("Invalid role");
    if (userId === adminId) throw new Error("You cannot change your own role");
    const profile = await profileFor(ctx, userId);
    if (profile?.userType === "admin") throw new Error("Revoke admin access before changing this role");
    const before = profile?.userType ?? "unassigned";
    if (profile) await ctx.db.patch(profile._id, { userType: role });
    else await ctx.db.insert("profiles", { userId, userType: role });
    await logAdminAction(ctx, adminId, "user_role_changed", { detail: `${userId}: ${before} -> ${role}` });
  },
});

export const setStatus = mutation({
  args: { userId: v.id("users"), status: v.union(v.literal("active"), v.literal("suspended")), reason: v.optional(v.string()) },
  handler: async (ctx, { userId, status, reason }) => {
    const adminId = await requireAdmin(ctx);
    if (userId === adminId) throw new Error("You cannot suspend yourself");
    const profile = await profileFor(ctx, userId);
    if (profile?.userType === "admin") throw new Error("Revoke admin access before suspending this account");
    const cleanReason = reason?.trim().slice(0, 500);
    if (status === "suspended" && !cleanReason) throw new Error("A reason is required to suspend an account");
    if (profile) {
      await ctx.db.patch(profile._id, {
        status,
        suspendedAt: status === "suspended" ? Date.now() : undefined,
        suspendedReason: status === "suspended" ? cleanReason : undefined,
      });
    } else {
      await ctx.db.insert("profiles", { userId, status });
    }
    if (status === "suspended") {
      // Revoke every session so the user is signed out everywhere immediately.
      const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
      for (const s of sessions) {
        const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect();
        await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));
        await ctx.db.delete(s._id);
      }
    }
    await logAdminAction(ctx, adminId, status === "suspended" ? "user_suspended" : "user_reactivated", {
      detail: `${userId}${cleanReason ? ` - ${cleanReason}` : ""}`,
    });
  },
});

async function userByEmail(ctx: MutationCtx, email: string) {
  const e = email.trim();
  return (
    (await ctx.db.query("users").withIndex("email", (q) => q.eq("email", e.toLowerCase())).first()) ??
    (await ctx.db.query("users").withIndex("email", (q) => q.eq("email", e)).first())
  );
}

export const grantAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const adminId = await requireAdmin(ctx);
    const user = await userByEmail(ctx, email);
    if (!user) throw new Error("No account exists with that email. They need to sign up first.");
    const profile = await profileFor(ctx, user._id);
    if (profile?.userType === "admin") throw new Error("That user is already an admin");
    if (profile) await ctx.db.patch(profile._id, { userType: "admin", status: "active", suspendedAt: undefined, suspendedReason: undefined });
    else await ctx.db.insert("profiles", { userId: user._id, userType: "admin" });
    await logAdminAction(ctx, adminId, "admin_granted", { detail: `${email.trim()} (${user._id})` });
  },
});

export const revokeAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const adminId = await requireAdmin(ctx);
    if (userId === adminId) throw new Error("You cannot revoke your own admin access");
    const profile = await profileFor(ctx, userId);
    if (profile?.userType !== "admin") throw new Error("That user is not an admin");
    await ctx.db.patch(profile._id, { userType: "talent" });
    await logAdminAction(ctx, adminId, "admin_revoked", { detail: userId });
  },
});
