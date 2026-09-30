import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUserId as getAuthUserId } from "./lib/auth";
import { CURRENT_TERMS_VERSION } from "./lib/legal";

/** Challenges live for 5 minutes and can be consumed exactly once. */
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Public (signed-in user) API: manage my passkeys
// ---------------------------------------------------------------------------

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("passkeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return rows
      .map((p) => ({
        id: p._id,
        deviceLabel: p.deviceLabel,
        createdAt: p.createdAt,
        lastUsedAt: p.lastUsedAt ?? null,
        transports: p.transports ?? [],
        deviceType: p.deviceType ?? null,
        backedUp: p.backedUp ?? false,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const rename = mutation({
  args: { passkeyId: v.id("passkeys"), deviceLabel: v.string() },
  handler: async (ctx, { passkeyId, deviceLabel }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const label = deviceLabel.trim().slice(0, 60);
    if (!label) throw new Error("Please enter a name for this passkey");
    const row = await ctx.db.get(passkeyId);
    if (!row || row.userId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(passkeyId, { deviceLabel: label });
  },
});

export const remove = mutation({
  args: { passkeyId: v.id("passkeys") },
  handler: async (ctx, { passkeyId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const row = await ctx.db.get(passkeyId);
    if (!row || row.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(passkeyId);
  },
});

/** State for the one-time "Add a passkey" nudge shown after login. */
export const nudgeState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const [profile, anyPasskey] = await Promise.all([
      ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first(),
      ctx.db.query("passkeys").withIndex("by_userId", (q) => q.eq("userId", userId)).first(),
    ]);
    return {
      hasProfile: !!profile,
      isAdmin: profile?.userType === "admin",
      hasPasskey: !!anyPasskey,
      dismissed: !!profile?.passkeyNudgeDismissedAt,
      termsCurrent: profile?.termsVersion === CURRENT_TERMS_VERSION,
    };
  },
});

export const dismissNudge = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (profile) await ctx.db.patch(profile._id, { passkeyNudgeDismissedAt: Date.now() });
  },
});

// ---------------------------------------------------------------------------
// Internal helpers used by the "use node" WebAuthn actions (passkeysNode.ts)
// ---------------------------------------------------------------------------

export const getUserInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return {
      email: user.email ?? null,
      name: profile?.fullName || profile?.username || user.name || null,
    };
  },
});

export const listForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("passkeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listForEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const trimmed = email.trim();
    const user =
      (await ctx.db.query("users").withIndex("email", (q) => q.eq("email", trimmed.toLowerCase())).first()) ??
      (await ctx.db.query("users").withIndex("email", (q) => q.eq("email", trimmed)).first());
    if (!user) return [];
    return await ctx.db
      .query("passkeys")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getByCredentialId = internalQuery({
  args: { credentialId: v.string() },
  handler: async (ctx, { credentialId }) => {
    return await ctx.db
      .query("passkeys")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", credentialId))
      .first();
  },
});

export const insertPasskey = internalMutation({
  args: {
    userId: v.id("users"),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
    transports: v.optional(v.array(v.string())),
    deviceLabel: v.string(),
    deviceType: v.optional(v.string()),
    backedUp: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dup = await ctx.db
      .query("passkeys")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", args.credentialId))
      .first();
    if (dup) throw new Error("Credential already registered");
    return await ctx.db.insert("passkeys", { ...args, createdAt: Date.now() });
  },
});

export const recordUse = internalMutation({
  args: { passkeyId: v.id("passkeys"), newCounter: v.number() },
  handler: async (ctx, { passkeyId, newCounter }) => {
    const row = await ctx.db.get(passkeyId);
    if (!row) return false;
    await ctx.db.patch(passkeyId, {
      counter: Math.max(row.counter, newCounter),
      lastUsedAt: Date.now(),
    });
    return true;
  },
});

export const createChallenge = internalMutation({
  args: {
    challenge: v.string(),
    type: v.union(v.literal("registration"), v.literal("authentication")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webauthnChallenges", {
      ...args,
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
    });
  },
});

/**
 * Atomically look up and DELETE a challenge (single use). Returns true only if it
 * existed, had the right type/user and had not expired.
 */
export const consumeChallenge = internalMutation({
  args: {
    challenge: v.string(),
    type: v.union(v.literal("registration"), v.literal("authentication")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { challenge, type, userId }) => {
    const row = await ctx.db
      .query("webauthnChallenges")
      .withIndex("by_challenge", (q) => q.eq("challenge", challenge))
      .first();
    if (!row) return false;
    await ctx.db.delete(row._id); // burn it whatever happens next
    if (row.type !== type) return false;
    if (row.expiresAt < Date.now()) return false;
    if (type === "registration" && row.userId !== userId) return false;
    return true;
  },
});

export const purgeExpiredChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("webauthnChallenges")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
      .take(500);
    await Promise.all(expired.map((r) => ctx.db.delete(r._id)));
    return expired.length;
  },
});

export const isSuspended = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile?.status === "suspended";
  },
});
