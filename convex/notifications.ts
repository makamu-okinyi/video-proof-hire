import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import {
  buildJobAlertHtml,
  buildStatusChangeEmailHtml,
  buildGenericNotificationHtml,
  sendResendEmail,
} from "./emailTemplates";

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

// --- Helpers for the email-sending actions below ---

export const getTalentRecipients = internalQuery({
  args: {},
  handler: async (ctx) => {
    const talentProfiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userType"), "talent"))
      .collect();
    const recipients = await Promise.all(
      talentProfiles.map(async (p) => {
        const authUser = await ctx.db.get(p.userId as Id<"users">);
        if (!authUser?.email) return null;
        return { username: p.username, email: authUser.email };
      })
    );
    return recipients.filter((r): r is { username: string | undefined; email: string } => r !== null);
  },
});

export const getRecipientEmail = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const [authUser, profile] = await Promise.all([
      ctx.db.get(userId as Id<"users">),
      ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first(),
    ]);
    return { email: authUser?.email ?? null, username: profile?.username ?? null };
  },
});

// Alert all talent users about a newly posted job (mirrors the retired
// `job-posting-alert` Supabase edge function). Fire-and-forget from CreateJob.tsx.
export const sendJobAlert = action({
  args: {
    jobTitle: v.string(),
    companyName: v.optional(v.string()),
    jobType: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const recipients = await ctx.runQuery(internal.notifications.getTalentRecipients, {});
    const subject = `New Opportunity: ${args.jobTitle} at ${args.companyName || "Startup Garage"}`;
    let emailsSent = 0;

    for (let i = 0; i < recipients.length; i += 5) {
      const batch = recipients.slice(i, i + 5);
      await Promise.all(
        batch.map(async (r) => {
          const recipientName = r.username || r.email.split("@")[0];
          const html = buildJobAlertHtml({
            recipientName,
            jobTitle: args.jobTitle,
            companyName: args.companyName || "Startup Garage",
            jobType: args.jobType || "Full-time",
            location: args.location,
          });
          await sendResendEmail(r.email, subject, html);
          emailsSent++;
        })
      );
    }

    return { success: true, emailsSent };
  },
});

// In-app notification + auto-message + email when an employer changes a job
// application (or venture pitch) status. Mirrors the retired `notify-status-change`
// Supabase edge function.
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

    // 3. Email
    const recipient = await ctx.runQuery(internal.notifications.getRecipientEmail, {
      userId: args.recipientId,
    });
    if (recipient.email) {
      const recipientName = recipient.username || recipient.email.split("@")[0] || "Applicant";
      const emailSubject = args.status === "shortlisted" ? `✓ ${title} — Startup Garage` : `${title} — Startup Garage`;
      const html = buildStatusChangeEmailHtml({
        status: args.status,
        type: args.type,
        title,
        message,
        recipientName,
      });
      await sendResendEmail(recipient.email, emailSubject, html);
    }

    return { success: true };
  },
});

// Generic notification email for new messages / application status changes, with
// authorization checks. Mirrors the retired `send-notification` Supabase edge function.
export const sendNotification = action({
  args: {
    type: v.union(v.literal("new_message"), v.literal("application_status")),
    recipientId: v.string(),
    senderName: v.optional(v.string()),
    messagePreview: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");
    if (senderId === args.recipientId) throw new Error("Cannot send notification to yourself");

    if (args.senderName && args.senderName.length > 100) throw new Error("senderName too long (max 100 chars)");
    if (args.messagePreview && args.messagePreview.length > 500) throw new Error("messagePreview too long (max 500 chars)");
    if (args.jobTitle && args.jobTitle.length > 200) throw new Error("jobTitle too long (max 200 chars)");
    if (args.companyName && args.companyName.length > 200) throw new Error("companyName too long (max 200 chars)");

    const authorized = await ctx.runQuery(internal.notifications.checkNotifyAuthorization, {
      type: args.type,
      senderId,
      recipientId: args.recipientId,
    });
    if (!authorized) throw new Error("Unauthorized to notify this recipient");

    const recipient = await ctx.runQuery(internal.notifications.getRecipientEmail, {
      userId: args.recipientId,
    });
    if (!recipient.email) throw new Error("Recipient email not found");

    const senderProfile = await ctx.runQuery(internal.notifications.getRecipientEmail, {
      userId: senderId,
    });

    const { subject, html } = buildGenericNotificationHtml({
      type: args.type,
      recipientName: recipient.username || "there",
      senderName: senderProfile.username || args.senderName || "Someone",
      messagePreview: args.messagePreview,
      jobTitle: args.jobTitle,
      companyName: args.companyName,
      status: args.status,
    });

    await sendResendEmail(recipient.email, subject, html);
    return { success: true };
  },
});

export const checkNotifyAuthorization = internalQuery({
  args: {
    type: v.union(v.literal("new_message"), v.literal("application_status")),
    senderId: v.string(),
    recipientId: v.string(),
  },
  handler: async (ctx, { type, senderId, recipientId }) => {
    if (type === "new_message") {
      const [a, b] = await Promise.all([
        ctx.db.query("conversations").withIndex("by_participants", (q) => q.eq("employerId", senderId).eq("candidateId", recipientId)).first(),
        ctx.db.query("conversations").withIndex("by_participants", (q) => q.eq("employerId", recipientId).eq("candidateId", senderId)).first(),
      ]);
      return !!(a || b);
    }
    // application_status: sender must be the employer on one of the recipient's job applications
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_applicantId", (q) => q.eq("applicantId", recipientId))
      .collect();
    for (const appRow of applications) {
      const job = await ctx.db.get(appRow.jobId);
      if (job?.employerId === senderId) return true;
    }
    return false;
  },
});
