import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveChallenges = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    return await ctx.db.get(challengeId);
  },
});

export const getEmployerChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("challenges")
      .withIndex("by_employerId", (q) => q.eq("employerId", userId))
      .order("desc")
      .collect();
  },
});

export const createChallenge = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    prizeDescription: v.optional(v.string()),
    prizeAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    skillsTags: v.optional(v.array(v.string())),
    videoPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("challenges", {
      ...args,
      employerId: userId,
      isFeatured: args.isFeatured ?? false,
      isActive: true,
    });
  },
});

export const updateChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    prizeDescription: v.optional(v.string()),
    prizeAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    skillsTags: v.optional(v.array(v.string())),
    videoPrompt: v.optional(v.string()),
  },
  handler: async (ctx, { challengeId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const challenge = await ctx.db.get(challengeId);
    if (!challenge || challenge.employerId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(challengeId, Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ));
  },
});

export const submitToChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    videoId: v.id("videos"),
  },
  handler: async (ctx, { challengeId, videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challengeId_userId", (q) =>
        q.eq("challengeId", challengeId).eq("userId", userId)
      )
      .first();
    if (existing) throw new Error("Already submitted");
    return await ctx.db.insert("challengeSubmissions", {
      challengeId,
      userId,
      videoId,
      status: "submitted",
    });
  },
});

export const getSubmissions = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const challenge = await ctx.db.get(challengeId);
    if (!challenge || challenge.employerId !== userId) return [];
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challengeId", (q) => q.eq("challengeId", challengeId))
      .collect();
    return await Promise.all(
      submissions.map(async (sub) => ({
        ...sub,
        video: await ctx.db.get(sub.videoId),
        user: await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", sub.userId))
          .first(),
      }))
    );
  },
});

export const getMySubmissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const submissions = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return await Promise.all(
      submissions.map(async (sub) => ({
        ...sub,
        challenge: await ctx.db.get(sub.challengeId),
      }))
    );
  },
});

export const markSubmissionWinner = mutation({
  args: { submissionId: v.id("challengeSubmissions") },
  handler: async (ctx, { submissionId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const sub = await ctx.db.get(submissionId);
    if (!sub) throw new Error("Submission not found");
    const challenge = await ctx.db.get(sub.challengeId);
    if (!challenge || challenge.employerId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(submissionId, { status: "winner" });
  },
});
