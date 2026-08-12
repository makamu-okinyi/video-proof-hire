import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getEmployerProfile = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId: targetUserId }) => {
    const userId = targetUserId ?? await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsertEmployerProfile = mutation({
  args: {
    companyName: v.optional(v.string()),
    companyDescription: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    companyLogoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const data = Object.fromEntries(
      Object.entries(args).filter(([, v]) => v !== undefined)
    );
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("employerProfiles", { userId, ...data });
    }
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
