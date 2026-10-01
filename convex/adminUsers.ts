import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { modifyAccountCredentials, invalidateSessions } from "@convex-dev/auth/server";
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

/* ------------------------------------------------------------------ manage accounts */

const USERNAME_OK = /^[a-z0-9][a-z0-9_.-]{2,29}$/;

async function revokeSessions(ctx: MutationCtx, userId: Id<"users">) {
  const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
  for (const s of sessions) {
    const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect();
    await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));
    await ctx.db.delete(s._id);
  }
}

/** Edit a user's name, username, company or sign-in email. Admin accounts cannot be edited here. */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
    companyName: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { userId, fullName, username, companyName, email }) => {
    const adminId = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("That user no longer exists");
    const profile = await profileFor(ctx, userId);
    if (profile?.userType === "admin") throw new Error("Admin accounts cannot be edited here");

    const patch: Record<string, string | undefined> = {};
    if (fullName !== undefined) patch.fullName = fullName.trim().slice(0, 100);
    if (companyName !== undefined) patch.companyName = companyName.trim().slice(0, 100);
    if (username !== undefined) {
      const raw = username.trim();
      if (profile?.userType === "employer") {
        patch.username = raw.slice(0, 50);
      } else if (raw) {
        const name = raw.replace(/^@+/, "").toLowerCase();
        if (!USERNAME_OK.test(name)) throw new Error("Usernames use 3-30 letters, numbers, dots, dashes or underscores");
        const taken = await ctx.db.query("profiles").withIndex("by_username", (q) => q.eq("username", name)).first();
        if (taken && taken.userId !== userId) throw new Error("That username is already taken");
        patch.username = name;
      }
    }
    if (Object.keys(patch).length) {
      if (profile) await ctx.db.patch(profile._id, patch);
      else await ctx.db.insert("profiles", { userId, ...patch });
    }

    if (email !== undefined) {
      const next = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(next)) throw new Error("Enter a valid email address");
      if (next !== (user.email ?? "").toLowerCase()) {
        const clash = await userByEmail(ctx, next);
        if (clash && clash._id !== userId) throw new Error("Another account already uses that email");
        const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).collect();
        for (const a of accounts) {
          if (a.provider === "password") await ctx.db.patch(a._id, { providerAccountId: next });
        }
        await ctx.db.patch(userId, { email: next });
      }
    }
    await logAdminAction(ctx, adminId, "user_edited", { detail: userId });
  },
});

/** Delete a user and all their data (runs the same erasure as self-service deletion). */
export const deleteUser = mutation({
  args: { userId: v.id("users"), confirm: v.literal("DELETE") },
  handler: async (ctx, { userId }) => {
    const adminId = await requireAdmin(ctx);
    if (userId === adminId) throw new Error("You cannot delete your own account here");
    const profile = await profileFor(ctx, userId);
    if (profile?.userType === "admin") throw new Error("Revoke admin access before deleting this account");
    if (profile) {
      await ctx.db.patch(profile._id, { status: "suspended", suspendedAt: Date.now(), suspendedReason: "Account deleted by an administrator" });
    }
    await revokeSessions(ctx, userId);
    await logAdminAction(ctx, adminId, "user_deleted", { detail: userId });
    await ctx.scheduler.runAfter(0, internal.account.eraseUserData, { userId });
  },
});

export const assertAdmin = internalQuery({
  args: {},
  handler: async (ctx) => requireAdmin(ctx),
});

export const targetInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    return user ? { email: user.email ?? null, role: profile?.userType ?? null } : null;
  },
});

export const auditReset = internalMutation({
  args: { adminId: v.string(), userId: v.string() },
  handler: async (ctx, { adminId, userId }) => {
    await logAdminAction(ctx, adminId, "user_password_reset", { detail: userId });
  },
});

/**
 * Set a new password for a user (for people who forgot theirs). The admin tells the user the
 * password out of band; all of the user's sessions are ended.
 */
export const resetPassword = action({
  args: { userId: v.id("users"), newPassword: v.string() },
  handler: async (ctx, { userId, newPassword }): Promise<void> => {
    const adminId: string = await ctx.runQuery(internal.adminUsers.assertAdmin, {});
    if (newPassword.length < 8 || newPassword.length > 200) throw new Error("Use at least 8 characters");
    const target = await ctx.runQuery(internal.adminUsers.targetInfo, { userId });
    if (!target?.email) throw new Error("That user has no email sign-in to reset");
    if (target.role === "admin") throw new Error("Admin passwords are reset from the admin sign-in screen");
    await modifyAccountCredentials(ctx, { provider: "password", account: { id: target.email, secret: newPassword } });
    await invalidateSessions(ctx, { userId });
    await ctx.runMutation(internal.adminUsers.auditReset, { adminId, userId });
  },
});
