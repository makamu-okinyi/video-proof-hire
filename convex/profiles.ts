import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
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
// granted out-of-band (see grantAdminByEmail), never by the user themselves.
const SELF_SERVICE_USER_TYPES = ["talent", "employer", "founder", "investor"];

export const setUserType = mutation({
  args: { userType: v.string() },
  handler: async (ctx, { userType }) => {
    if (!SELF_SERVICE_USER_TYPES.includes(userType)) {
      throw new Error(`Cannot self-assign userType "${userType}"`);
    }
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { userType });
    } else {
      await ctx.db.insert("profiles", { userId, userType });
    }
  },
});

// Protected admin bootstrap — only reachable via `npx convex run` with a
// deploy key (i.e. from the CLI, never from client code), since it is not
// exported to the public mutation surface the frontend calls.
export const grantAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user) throw new Error(`No user found with email ${email}`);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { userType: "admin" });
    } else {
      await ctx.db.insert("profiles", { userId: user._id, userType: "admin" });
    }
    return { userId: user._id };
  },
});
