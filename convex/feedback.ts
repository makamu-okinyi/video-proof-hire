import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getActiveUserId as getAuthUserId } from "./lib/auth";
import { requireAdmin, logAdminAction } from "./lib/admin";

const DAY = 24 * 60 * 60 * 1000;
/** Account must be at least this old before the first ask. */
const MIN_ACCOUNT_AGE = 2 * DAY;
/** After the prompt is shown or dismissed, wait this long before asking again. */
const REASK_AFTER_DISMISS = 45 * DAY;
/** After someone gives feedback, wait this long before asking again. */
const REASK_AFTER_GIVEN = 180 * DAY;

/**
 * Should the signed-in user be asked how they are finding Donjo? Never admins, never brand
 * new accounts, and never more than occasionally.
 */
export const shouldPrompt = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile || profile.userType === "admin" || !profile.userType || profile.feedbackOptOut) return { show: false };
    const user = await ctx.db.get(userId);
    const now = Date.now();
    if (!user || now - user._creationTime < MIN_ACCOUNT_AGE) return { show: false };
    if (profile.feedbackGivenAt && now - profile.feedbackGivenAt < REASK_AFTER_GIVEN) return { show: false };
    if (profile.feedbackPromptedAt && now - profile.feedbackPromptedAt < REASK_AFTER_DISMISS) return { show: false };
    const name = profile.userType === "employer" ? profile.companyName || profile.username : profile.fullName || profile.username;
    return { show: true, displayName: name ?? null };
  },
});

/** The user closed the prompt without answering: stay quiet for a while. */
export const snooze = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile) await ctx.db.patch(profile._id, { feedbackPromptedAt: Date.now() });
  },
});

/** The user never wants to be asked again. */
export const neverAsk = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile) await ctx.db.patch(profile._id, { feedbackOptOut: true, feedbackPromptedAt: Date.now() });
  },
});

/** Save a rating (and optional comment). It is NOT published: it waits for admin approval. */
export const submit = mutation({
  args: {
    rating: v.number(),
    comment: v.optional(v.string()),
    allowPublic: v.boolean(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { rating, comment, allowPublic, displayName }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ConvexError("Choose a rating from 1 to 5 stars.");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (!profile || profile.userType === "admin") throw new ConvexError("Feedback is for Donjo members.");
    const text = comment?.trim().slice(0, 600) || undefined;
    await ctx.db.insert("feedback", {
      userId,
      rating,
      comment: text,
      allowPublic: allowPublic && !!text,
      displayName: (displayName?.trim() || profile.fullName || profile.username || "A Donjo member").slice(0, 60),
      role: profile.userType ?? "member",
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.db.patch(profile._id, { feedbackGivenAt: Date.now(), feedbackPromptedAt: Date.now() });
  },
});

/** Admin: every submission, newest first, optionally one status. */
export const adminList = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))) },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx);
    const rows = status
      ? await ctx.db.query("feedback").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(300)
      : await ctx.db.query("feedback").order("desc").take(300);
    return rows.map((r) => ({
      id: r._id, rating: r.rating, comment: r.comment ?? null, allowPublic: r.allowPublic,
      displayName: r.displayName, role: r.role, status: r.status, createdAt: r.createdAt,
    }));
  },
});

/** Admin: approve (makes it a public testimonial if the user allowed it) or reject. */
export const moderate = mutation({
  args: { id: v.id("feedback"), status: v.union(v.literal("approved"), v.literal("rejected")) },
  handler: async (ctx, { id, status }) => {
    const adminId = await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("That feedback no longer exists");
    if (status === "approved" && (!row.allowPublic || !row.comment)) {
      throw new Error("This user did not agree to have their words published, so it can only be kept as private feedback.");
    }
    await ctx.db.patch(id, { status, handledAt: Date.now() });
    await logAdminAction(ctx, adminId, status === "approved" ? "feedback_approved" : "feedback_rejected", { detail: id });
  },
});

/** Public: approved testimonials only (real ratings, admin-approved, user-consented). */
export const publicTestimonials = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const rows = await ctx.db.query("feedback").withIndex("by_status", (q) => q.eq("status", "approved")).order("desc").take(Math.min(limit, 50));
    return rows
      .filter((r) => r.allowPublic && r.comment)
      .map((r) => ({ id: r._id, rating: r.rating, comment: r.comment, displayName: r.displayName, role: r.role }));
  },
});
