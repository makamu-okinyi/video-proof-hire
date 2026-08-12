import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyShortlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const shortlists = await ctx.db
      .query("shortlists")
      .withIndex("by_recruiterId", (q) => q.eq("recruiterId", userId))
      .collect();
    return await Promise.all(
      shortlists.map(async (s) => ({
        ...s,
        talent: await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", s.talentId)).first(),
        video: s.videoId ? await ctx.db.get(s.videoId) : null,
      }))
    );
  },
});

export const toggleShortlist = mutation({
  args: {
    talentId: v.string(),
    videoId: v.optional(v.id("videos")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { talentId, videoId, notes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("shortlists")
      .withIndex("by_recruiterId_talentId", (q) =>
        q.eq("recruiterId", userId).eq("talentId", talentId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("shortlists", { recruiterId: userId, talentId, videoId, notes });
      return true;
    }
  },
});

export const isShortlisted = query({
  args: { talentId: v.string() },
  handler: async (ctx, { talentId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("shortlists")
      .withIndex("by_recruiterId_talentId", (q) =>
        q.eq("recruiterId", userId).eq("talentId", talentId)
      )
      .first();
    return !!existing;
  },
});

export const createHiringLead = mutation({
  args: {
    talentId: v.string(),
    videoId: v.optional(v.id("videos")),
    message: v.optional(v.string()),
    companyName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("hiringLeads", {
      recruiterId: userId,
      talentId: args.talentId,
      videoId: args.videoId,
      status: "pending",
      message: args.message,
      companyName: args.companyName,
    });
  },
});

export const getMyLeads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const leads = await ctx.db
      .query("hiringLeads")
      .withIndex("by_talentId", (q) => q.eq("talentId", userId))
      .collect();
    return await Promise.all(
      leads.map(async (lead) => ({
        ...lead,
        recruiter: await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", lead.recruiterId)).first(),
      }))
    );
  },
});

export const updateLeadStatus = mutation({
  args: { leadId: v.id("hiringLeads"), status: v.string() },
  handler: async (ctx, { leadId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.talentId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(leadId, { status });
  },
});
