import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getPublicVideos = query({
  args: { skillCategory: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, { skillCategory, limit = 50 }) => {
    let q = ctx.db.query("videos");
    if (skillCategory) {
      const results = await q
        .withIndex("by_skillCategory", (qi) => qi.eq("skillCategory", skillCategory))
        .filter((qi) => qi.eq(qi.field("isPrivate"), false))
        .order("desc")
        .take(limit);
      return results;
    }
    return await q
      .filter((qi) => qi.eq(qi.field("isPrivate"), false))
      .order("desc")
      .take(limit);
  },
});

export const getUserVideos = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isPrivate"), false))
      .order("desc")
      .collect();
  },
});

export const getMyVideos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("videos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    return await ctx.db.get(videoId);
  },
});

export const createVideo = mutation({
  args: {
    videoUrl: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    skillCategory: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("videos", {
      userId,
      videoUrl: args.videoUrl,
      title: args.title,
      description: args.description,
      thumbnailUrl: args.thumbnailUrl,
      isPrivate: args.isPrivate ?? false,
      skillCategory: args.skillCategory,
      storageId: args.storageId,
      views: 0,
      likes: 0,
    });
  },
});

export const updateVideo = mutation({
  args: {
    videoId: v.id("videos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    skillCategory: v.optional(v.string()),
  },
  handler: async (ctx, { videoId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const video = await ctx.db.get(videoId);
    if (!video || video.userId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(videoId, Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ));
  },
});

export const deleteVideo = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const video = await ctx.db.get(videoId);
    if (!video || video.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(videoId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const likeVideo = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("videoLikes")
      .withIndex("by_videoId_userId", (q) =>
        q.eq("videoId", videoId).eq("userId", userId)
      )
      .first();
    const video = await ctx.db.get(videoId);
    if (!video) return;
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(videoId, { likes: Math.max(0, video.likes - 1) });
      return false;
    } else {
      await ctx.db.insert("videoLikes", { videoId, userId });
      await ctx.db.patch(videoId, { likes: video.likes + 1 });
      return true;
    }
  },
});

export const hasLikedVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("videoLikes")
      .withIndex("by_videoId_userId", (q) =>
        q.eq("videoId", videoId).eq("userId", userId)
      )
      .first();
    return !!existing;
  },
});

export const saveVideo = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("savedVideos")
      .withIndex("by_videoId_userId", (q) =>
        q.eq("videoId", videoId).eq("userId", userId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("savedVideos", { videoId, userId });
      return true;
    }
  },
});

export const hasSavedVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("savedVideos")
      .withIndex("by_videoId_userId", (q) =>
        q.eq("videoId", videoId).eq("userId", userId)
      )
      .first();
    return !!existing;
  },
});

export const getSavedVideos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const saved = await ctx.db
      .query("savedVideos")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const videos = await Promise.all(saved.map((s) => ctx.db.get(s.videoId)));
    return videos.filter(Boolean);
  },
});

export const recordView = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("videoViews", { videoId, userId: userId ?? undefined });
    const video = await ctx.db.get(videoId);
    if (video) {
      await ctx.db.patch(videoId, { views: video.views + 1 });
    }
  },
});

export const addComment = mutation({
  args: {
    videoId: v.id("videos"),
    content: v.string(),
    parentId: v.optional(v.id("videoComments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("videoComments", {
      videoId: args.videoId,
      userId,
      content: args.content,
      parentId: args.parentId,
      likesCount: 0,
    });
  },
});

export const getComments = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, { videoId }) => {
    return await ctx.db
      .query("videoComments")
      .withIndex("by_videoId", (q) => q.eq("videoId", videoId))
      .order("desc")
      .collect();
  },
});

export const getFeedStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const [totalVideos, myVideos] = await Promise.all([
      ctx.db.query("videos").filter((q) => q.eq(q.field("isPrivate"), false)).collect(),
      userId
        ? ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", userId)).collect()
        : Promise.resolve([]),
    ]);
    return {
      totalVideos: totalVideos.length,
      myVideos: myVideos.length,
    };
  },
});
