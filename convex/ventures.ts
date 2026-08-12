import { query, mutation, action, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function withFounderProfiles<T extends { userId: string }>(
  ctx: QueryCtx | MutationCtx,
  founders: T[]
) {
  return await Promise.all(
    founders.map(async (f) => ({
      ...f,
      profile: await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", f.userId))
        .first(),
    }))
  );
}

export const getActiveVentures = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
    return await Promise.all(
      ventures.map(async (v) => ({
        ...v,
        founders: await withFounderProfiles(
          ctx,
          await ctx.db
            .query("ventureFounders")
            .withIndex("by_ventureId", (q) => q.eq("ventureId", v._id))
            .collect()
        ),
      }))
    );
  },
});

export const getVenture = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    const venture = await ctx.db.get(ventureId);
    if (!venture) return null;
    const [foundersRaw, pitchDecks] = await Promise.all([
      ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId)).collect(),
      ctx.db.query("pitchDecks").withIndex("by_ventureId_isCurrent", (q) => q.eq("ventureId", ventureId).eq("isCurrentVersion", true)).collect(),
    ]);
    const founders = await withFounderProfiles(ctx, foundersRaw);
    return { ...venture, founders, pitchDecks };
  },
});

export const getMyVentures = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const founderRows = await ctx.db
      .query("ventureFounders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const ventures = await Promise.all(founderRows.map((f) => ctx.db.get(f.ventureId)));
    const pitchDecks = await Promise.all(
      ventures.filter(Boolean).map((v) =>
        ctx.db.query("pitchDecks").withIndex("by_ventureId_isCurrent", (q) => q.eq("ventureId", v!._id).eq("isCurrentVersion", true)).first()
      )
    );
    return ventures.filter(Boolean).map((v, i) => ({ ...v!, pitchDeck: pitchDecks[i] }));
  },
});

export const getFounderVentures = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const founderRows = await ctx.db
      .query("ventureFounders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const ventures = await Promise.all(founderRows.map((f) => ctx.db.get(f.ventureId)));
    return ventures.filter(Boolean);
  },
});

export const getAllVentures = query({
  args: {},
  handler: async (ctx) => {
    const ventures = await ctx.db.query("ventures").order("desc").collect();
    return await Promise.all(
      ventures.map(async (v) => ({
        ...v,
        founders: await withFounderProfiles(
          ctx,
          await ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", v._id)).collect()
        ),
        pitchDecks: await ctx.db
          .query("pitchDecks")
          .withIndex("by_ventureId_isCurrent", (q) => q.eq("ventureId", v._id).eq("isCurrentVersion", true))
          .collect(),
      }))
    );
  },
});

export const getPendingVentures = query({
  args: {},
  handler: async (ctx) => {
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "submitted"))
      .collect();
    return await Promise.all(
      ventures.map(async (v) => ({
        ...v,
        founders: await withFounderProfiles(
          ctx,
          await ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", v._id)).collect()
        ),
        pitchDecks: await ctx.db
          .query("pitchDecks")
          .withIndex("by_ventureId_isCurrent", (q) => q.eq("ventureId", v._id).eq("isCurrentVersion", true))
          .collect(),
      }))
    );
  },
});

export const createVenture = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    solution: v.optional(v.string()),
    marketSize: v.optional(v.string()),
    traction: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    stage: v.string(),
    industry: v.optional(v.array(v.string())),
    techStack: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    pitchVideoUrl: v.optional(v.string()),
    pitchVideoThumbnail: v.optional(v.string()),
    isFundraising: v.optional(v.boolean()),
    fundingGoal: v.optional(v.number()),
    hackathonName: v.optional(v.string()),
    hackathonCohort: v.optional(v.string()),
    founderTitle: v.optional(v.string()),
  },
  handler: async (ctx, { founderTitle, ...args }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const ventureId = await ctx.db.insert("ventures", {
      ...args,
      reviewStatus: "submitted",
      isActive: true,
      isFeatured: false,
    });
    await ctx.db.insert("ventureFounders", {
      ventureId,
      userId,
      role: "lead",
      title: founderTitle,
      isLead: true,
    });
    return ventureId;
  },
});

export const updateFounderTitle = mutation({
  args: { ventureId: v.id("ventures"), title: v.string() },
  handler: async (ctx, { ventureId, title }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const founder = await ctx.db
      .query("ventureFounders")
      .withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!founder) throw new Error("Not authorized");
    await ctx.db.patch(founder._id, { title });
  },
});

export const updateVenture = mutation({
  args: {
    ventureId: v.id("ventures"),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    solution: v.optional(v.string()),
    marketSize: v.optional(v.string()),
    traction: v.optional(v.string()),
    businessModel: v.optional(v.string()),
    stage: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    techStack: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    pitchVideoUrl: v.optional(v.string()),
    pitchVideoThumbnail: v.optional(v.string()),
    isFundraising: v.optional(v.boolean()),
    fundingGoal: v.optional(v.number()),
    fundingRaised: v.optional(v.number()),
    reviewStatus: v.optional(v.string()),
  },
  handler: async (ctx, { ventureId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const founder = await ctx.db
      .query("ventureFounders")
      .withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();
    if (!founder) throw new Error("Not authorized");
    await ctx.db.patch(ventureId, Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ));
  },
});

export const updateVentureStatus = mutation({
  args: { ventureId: v.id("ventures"), reviewStatus: v.string() },
  handler: async (ctx, { ventureId, reviewStatus }) => {
    await ctx.db.patch(ventureId, { reviewStatus });
  },
});

export const getPitchDecks = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    return await ctx.db
      .query("pitchDecks")
      .withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId))
      .order("desc")
      .collect();
  },
});

export const addPitchDeck = mutation({
  args: {
    ventureId: v.id("ventures"),
    title: v.string(),
    fileUrl: v.string(),
    fileType: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("pitchDecks")
      .withIndex("by_ventureId_isCurrent", (q) =>
        q.eq("ventureId", args.ventureId).eq("isCurrentVersion", true)
      )
      .collect();
    const nextVersion = existing.length > 0 ? Math.max(...existing.map((d) => d.version)) + 1 : 1;
    await Promise.all(existing.map((d) => ctx.db.patch(d._id, { isCurrentVersion: false })));
    return await ctx.db.insert("pitchDecks", {
      ventureId: args.ventureId,
      title: args.title,
      fileUrl: args.fileUrl,
      fileType: args.fileType,
      storageId: args.storageId,
      version: nextVersion,
      isCurrentVersion: true,
      uploadedBy: userId,
    });
  },
});

export const generatePitchDeckUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const bookmarkVenture = mutation({
  args: { ventureId: v.id("ventures"), action: v.string(), notes: v.optional(v.string()) },
  handler: async (ctx, { ventureId, action, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("investorBookmarks")
      .withIndex("by_investorId_ventureId", (q) =>
        q.eq("investorId", userId).eq("ventureId", ventureId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { action, notes });
    } else {
      await ctx.db.insert("investorBookmarks", {
        investorId: userId,
        ventureId,
        action,
        notes,
      });
    }
  },
});

export const removeBookmark = mutation({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("investorBookmarks")
      .withIndex("by_investorId_ventureId", (q) =>
        q.eq("investorId", userId).eq("ventureId", ventureId)
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const isVentureBookmarked = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("investorBookmarks")
      .withIndex("by_investorId_ventureId", (q) =>
        q.eq("investorId", userId).eq("ventureId", ventureId)
      )
      .first();
  },
});

export const getMyBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const bookmarks = await ctx.db
      .query("investorBookmarks")
      .withIndex("by_investorId", (q) => q.eq("investorId", userId))
      .collect();
    const ventures = await Promise.all(bookmarks.map((b) => ctx.db.get(b.ventureId)));
    return bookmarks.map((b, i) => ({ ...b, venture: ventures[i] }));
  },
});

export const getFounderStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ventures: 0, totalFunding: 0 };
    const founderRows = await ctx.db
      .query("ventureFounders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const ventures = await Promise.all(founderRows.map((f) => ctx.db.get(f.ventureId)));
    const active = ventures.filter((v) => v?.isActive);
    const totalFunding = active.reduce((sum, v) => sum + (v?.fundingRaised ?? 0), 0);
    return { ventures: active.length, totalFunding };
  },
});
