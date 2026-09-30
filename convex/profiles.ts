import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getActiveUserId } from "./lib/auth";
import { KENYA_COUNTIES } from "./lib/kenya";
import { CURRENT_TERMS_VERSION } from "./lib/legal";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getPublicProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getProfileBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

export const upsertProfile = mutation({
  args: {
    // userType is intentionally not settable here — use setUserType, which
    // restricts values to the self-service allowlist.
    username: v.optional(v.string()),
    skillCategory: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    avatar: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    companyName: v.optional(v.string()),
    industry: v.optional(v.string()),
    companySize: v.optional(v.string()),
    aboutUs: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    githubUrl2: v.optional(v.string()),
    cultureVideoUrl: v.optional(v.string()),
    perks: v.optional(v.array(v.string())),
    slug: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    fullName: v.optional(v.string()),
    notifyNewApplicants: v.optional(v.string()),
    notifyMarketing: v.optional(v.boolean()),
    twoFactorEnabled: v.optional(v.boolean()),
    county: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getActiveUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (args.county !== undefined && args.county !== "" && !KENYA_COUNTIES.includes(args.county)) {
      throw new Error("Unknown county");
    }
    if (args.country !== undefined && args.country.length > 80) throw new Error("Country is too long");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const data = Object.fromEntries(
      Object.entries(args).filter(([, v]) => v !== undefined)
    );
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", { userId, ...data });
    }
  },
});

/** Record that the signed-in user accepted the current Terms of Use and Privacy Policy. */
export const acceptTerms = mutation({
  args: { version: v.string() },
  handler: async (ctx, { version }) => {
    const userId = await getActiveUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    if (version !== CURRENT_TERMS_VERSION) throw new Error("These terms have been updated. Please reload and review them.");
    const existing = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    const data = { termsAcceptedAt: Date.now(), termsVersion: version };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("profiles", { userId, ...data });
  },
});

/**
 * Called by the client the moment it sees its own account is suspended: revokes every session
 * (so a fresh password login cannot be kept alive or refreshed) and returns whether it did.
 */
export const revokeIfSuspended = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile?.status !== "suspended") return false;
    const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    for (const s of sessions) {
      const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect();
      await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));
      await ctx.db.delete(s._id);
    }
    return true;
  },
});

export const getMyUserId = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserId(ctx);
  },
});

export const bootstrapProfile = internalMutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
    userType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) {
      await ctx.db.insert("profiles", {
        userId: args.userId,
        username: args.username,
        userType: args.userType || "talent",
      });
    }
  },
});

// Self-service roles only. "admin" and "judge" are privileged and must be
// granted out-of-band (see internal admin:grantAdminByEmail), never by the user themselves.
const SELF_SERVICE_USER_TYPES = ["talent", "employer", "founder", "investor"];

export const setUserType = mutation({
  args: { userType: v.string() },
  handler: async (ctx, { userType }) => {
    if (!SELF_SERVICE_USER_TYPES.includes(userType)) {
      throw new Error(`Cannot self-assign userType "${userType}"`);
    }
    const userId = await getActiveUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing?.userType === "admin") throw new Error("Cannot change an admin role here");
    if (existing) {
      await ctx.db.patch(existing._id, { userType });
    } else {
      await ctx.db.insert("profiles", { userId, userType });
    }
  },
});
