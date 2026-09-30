import { action, internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  createAccount,
  getAuthSessionId,
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { logAdminAction } from "./lib/admin";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SETUP_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD = 12;

const norm = (email: string) => email.trim().toLowerCase().slice(0, 200);

async function hit(ctx: MutationCtx, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = await ctx.db.query("rateLimits").withIndex("by_key", (q) => q.eq("key", key)).unique();
  if (!row) {
    await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
    return;
  }
  if (now - row.windowStart > windowMs) {
    await ctx.db.patch(row._id, { windowStart: now, count: 1 });
    return;
  }
  if (row.count >= limit) throw new Error("RATE_LIMITED");
  await ctx.db.patch(row._id, { count: row.count + 1 });
}

/* ------------------------------------------------------------------ internal helpers */

export const rateLimit = internalMutation({
  args: { key: v.string(), limit: v.number(), windowMs: v.number() },
  handler: async (ctx, { key, limit, windowMs }) => hit(ctx, key, limit, windowMs),
});

export const getSetup = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const row = await ctx.db.query("passwordSetups").withIndex("by_email", (q) => q.eq("email", email)).first();
    return row && row.expiresAt > Date.now() ? row : null;
  },
});

export const findUser = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
  },
});

export const userById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.get(userId),
});

export const upsertSetup = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const now = Date.now();
    const row = await ctx.db.query("passwordSetups").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (row) await ctx.db.patch(row._id, { createdAt: now, expiresAt: now + SETUP_TTL_MS });
    else await ctx.db.insert("passwordSetups", { email, createdAt: now, expiresAt: now + SETUP_TTL_MS });
  },
});

export const finishSetup = internalMutation({
  args: { email: v.string(), userId: v.id("users"), makeAdmin: v.boolean() },
  handler: async (ctx, { email, userId, makeAdmin }) => {
    const row = await ctx.db.query("passwordSetups").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (row) await ctx.db.delete(row._id);
    if (makeAdmin) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
      if (profile) await ctx.db.patch(profile._id, { userType: "admin" });
      else await ctx.db.insert("profiles", { userId, userType: "admin" });
    }
    await logAdminAction(ctx, userId, makeAdmin ? "admin_first_login" : "password_setup", { detail: email });
  },
});

export const auditPasswordChange = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await logAdminAction(ctx, userId, "password_changed", { detail: "via settings" });
  },
});

/* ------------------------------------------------------------------ arming (CLI only) */

/**
 * Require `email` to choose a new password on its next sign-in attempt, without knowing the old one.
 * If the account already exists its current password is locked (replaced by a random secret) and all
 * its sessions are ended, so a forgotten or leaked password stops working immediately.
 *   npx convex run firstLogin:arm '{"email":"you@example.com"}'
 * The account becomes an admin when it completes the first login.
 */
export const arm = internalAction({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<{ email: string; existingAccount: boolean; locked: boolean }> => {
    const e = norm(email);
    if (!EMAIL.test(e)) throw new Error("Invalid email");
    const user = await ctx.runQuery(internal.firstLogin.findUser, { email: e });
    let locked = false;
    if (user) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      try {
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: e, secret } });
        locked = true;
      } catch {
        locked = false; // no password account (for example Google only): nothing to lock
      }
      await invalidateSessions(ctx, { userId: user._id });
    }
    await ctx.runMutation(internal.firstLogin.upsertSetup, { email: e });
    return { email: e, existingAccount: !!user, locked };
  },
});

/* ------------------------------------------------------------------ public: login steps */

/** Step 1 of the admin sign-in: "activate" only while an unexpired first-login setup exists for the email. */
export const loginStep = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<"activate" | "password"> => {
    const e = norm(email);
    await hit(ctx, `loginStep:${e}`, 20, 15 * 60 * 1000);
    await hit(ctx, "loginStep:all", 600, 60 * 60 * 1000);
    if (!EMAIL.test(e)) return "password";
    const row = await ctx.db.query("passwordSetups").withIndex("by_email", (q) => q.eq("email", e)).first();
    return row && row.expiresAt > Date.now() ? "activate" : "password";
  },
});

/** Step 2 (first visit only): set the password for an armed email. The caller then signs in normally. */
export const completeFirstLogin = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }): Promise<void> => {
    const e = norm(email);
    await ctx.runMutation(internal.firstLogin.rateLimit, { key: `firstLogin:${e}`, limit: 10, windowMs: 15 * 60 * 1000 });
    const setup = await ctx.runQuery(internal.firstLogin.getSetup, { email: e });
    if (!setup) throw new Error("Not allowed");
    if (password.length < MIN_PASSWORD || password.length > 200) throw new Error("Use at least 12 characters");

    const existing = await ctx.runQuery(internal.firstLogin.findUser, { email: e });
    let userId;
    if (existing) {
      userId = existing._id;
      try {
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: e, secret: password } });
      } catch {
        await createAccount(ctx, { provider: "password", account: { id: e, secret: password }, profile: { email: e }, shouldLinkViaEmail: true });
      }
      await invalidateSessions(ctx, { userId });
    } else {
      const created = await createAccount(ctx, { provider: "password", account: { id: e, secret: password }, profile: { email: e } });
      userId = created.user._id;
    }
    await ctx.runMutation(internal.firstLogin.finishSetup, { email: e, userId, makeAdmin: true });
  },
});

/* ------------------------------------------------------------------ public: change password */

/** Change the signed-in user's own password. Requires the current password; other sessions are ended. */
export const changePassword = action({
  args: { current: v.string(), next: v.string() },
  handler: async (ctx, { current, next }): Promise<void> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authorized");
    const user = await ctx.runQuery(internal.firstLogin.userById, { userId });
    const email = user?.email;
    if (!email) throw new Error("Not authorized");
    if (next.length < MIN_PASSWORD || next.length > 200) throw new Error("Use at least 12 characters");
    if (next === current) throw new Error("Choose a different password");
    await ctx.runMutation(internal.firstLogin.rateLimit, { key: `pwchange:${userId}`, limit: 5, windowMs: 15 * 60 * 1000 });
    try {
      await retrieveAccount(ctx, { provider: "password", account: { id: email, secret: current } });
    } catch {
      throw new Error("Current password is incorrect");
    }
    await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: next } });
    const sessionId = await getAuthSessionId(ctx);
    await invalidateSessions(ctx, { userId, except: sessionId ? [sessionId] : [] });
    await ctx.runMutation(internal.firstLogin.auditPasswordChange, { userId });
  },
});
