import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getActiveUserId as getAuthUserId } from "./lib/auth";

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

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Checks an uploaded file is a small image and returns its public URL. Deletes it if not. */
async function acceptUploadedImage(
  ctx: { db: any; storage: any },
  storageId: any
): Promise<string> {
  const meta = await ctx.db.system.get(storageId);
  if (!meta) throw new ConvexError("That upload could not be found. Please try again.");
  if (!IMAGE_TYPES.includes(meta.contentType ?? "") || meta.size > MAX_IMAGE_BYTES) {
    await ctx.storage.delete(storageId);
    throw new ConvexError("Please upload a JPEG, PNG, WebP or GIF image under 5MB.");
  }
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new ConvexError("That upload could not be found. Please try again.");
  return url;
}

/** Sets the signed-in user's profile picture from a file uploaded via generateAvatarUploadUrl. */
export const setAvatarFromUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const url = await acceptUploadedImage(ctx, storageId);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { avatar: url });
    else await ctx.db.insert("profiles", { userId, avatar: url });
    return url;
  },
});

/** Sets the employer's company logo from a file uploaded via generateAvatarUploadUrl. */
export const setCompanyLogoFromUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const url = await acceptUploadedImage(ctx, storageId);
    const existing = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { companyLogoUrl: url });
    else await ctx.db.insert("employerProfiles", { userId, companyLogoUrl: url });
    return url;
  },
});

export const removeCompanyLogo = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("employerProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { companyLogoUrl: undefined });
  },
});
