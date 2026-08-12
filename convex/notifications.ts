import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";

export const getMyNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== userId) return;
    await ctx.db.patch(notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_isRead", (q) =>
        q.eq("userId", userId).eq("isRead", false)
      )
      .collect();
    await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
  },
});

export const create = internalMutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    actionUrl: v.optional(v.string()),
    relatedUserId: v.optional(v.string()),
    relatedVideoId: v.optional(v.id("videos")),
    relatedJobId: v.optional(v.id("jobPostings")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", { ...args, isRead: false });
  },
});

// In-app notification + auto-message when an employer changes a job
// application (or venture pitch) status.
export const notifyStatusChange = action({
  args: {
    type: v.union(v.literal("job_status"), v.literal("venture_status")),
    recipientId: v.string(),
    status: v.union(v.literal("shortlisted"), v.literal("rejected")),
    jobApplicationId: v.optional(v.id("jobApplications")),
    jobId: v.optional(v.id("jobPostings")),
    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    ventureId: v.optional(v.string()),
    ventureName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");
    if (senderId === args.recipientId) throw new Error("Invalid request");

    const notifType =
      args.type === "job_status"
        ? args.status === "shortlisted" ? "job_shortlisted" : "job_rejected"
        : args.status === "shortlisted" ? "pitch_shortlisted" : "pitch_rejected";

    let title = "";
    let message = "";
    let actionUrl = "/notifications";

    if (args.type === "job_status") {
      const jobTitle = args.jobTitle || "the position";
      const companyName = args.companyName || "the company";
      title = `Application ${args.status}`;
      message = `Your application for ${jobTitle} at ${companyName} has been ${args.status}.`;
      actionUrl = "/messages";
    } else {
      const ventureName = args.ventureName || "your venture";
      title = `Pitch ${args.status}`;
      message = `${ventureName} has been ${args.status} by the review team.`;
      actionUrl = "/founder";
    }

    // 1. In-app notification
    await ctx.runMutation(internal.notifications.create, {
      userId: args.recipientId,
      type: notifType,
      title,
      message,
      actionUrl,
      relatedUserId: senderId,
      relatedJobId: args.jobId,
    });

    // 2. Conversation + auto-message (job applications only)
    if (args.type === "job_status" && args.jobApplicationId) {
      const autoMessage =
        args.status === "shortlisted"
          ? "Congratulations! Your application has been shortlisted. We may reach out to you soon."
          : "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.";
      await ctx.runMutation(api.messages.startConversation, {
        otherUserId: args.recipientId,
        jobApplicationId: args.jobApplicationId,
        initialMessage: autoMessage,
      });
    }

    return { success: true };
  },
});
