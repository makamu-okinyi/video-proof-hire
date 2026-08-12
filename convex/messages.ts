import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const [asEmployer, asCandidate] = await Promise.all([
      ctx.db.query("conversations").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
      ctx.db.query("conversations").withIndex("by_candidateId", (q) => q.eq("candidateId", userId)).collect(),
    ]);
    const all = [...asEmployer, ...asCandidate];
    const uniqueIds = new Set<string>();
    const unique = all.filter((c) => { const id = c._id; if (uniqueIds.has(id)) return false; uniqueIds.add(id); return true; });
    return await Promise.all(
      unique.map(async (conv) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();
        const unreadCount = await ctx.db
          .query("messages")
          .withIndex("by_conversationId_isRead", (q) =>
            q.eq("conversationId", conv._id).eq("isRead", false)
          )
          .collect();
        const otherId = conv.employerId === userId ? conv.candidateId : conv.employerId;
        const otherProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", otherId))
          .first();
        return {
          ...conv,
          lastMessage,
          unreadCount: unreadCount.filter((m) => m.senderId !== userId).length,
          otherProfile,
        };
      })
    );
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const conv = await ctx.db.get(conversationId);
    if (!conv || (conv.employerId !== userId && conv.candidateId !== userId)) return [];
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  handler: async (ctx, { conversationId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const conv = await ctx.db.get(conversationId);
    if (!conv || (conv.employerId !== userId && conv.candidateId !== userId)) throw new Error("Not authorized");
    return await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      content,
      isRead: false,
    });
  },
});

export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_isRead", (q) =>
        q.eq("conversationId", conversationId).eq("isRead", false)
      )
      .collect();
    await Promise.all(
      unread
        .filter((m) => m.senderId !== userId)
        .map((m) => ctx.db.patch(m._id, { isRead: true }))
    );
  },
});

export const startConversation = mutation({
  args: {
    otherUserId: v.string(),
    jobApplicationId: v.optional(v.id("jobApplications")),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, { otherUserId, jobApplicationId, initialMessage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("employerId", userId).eq("candidateId", otherUserId)
      )
      .first();
    const existingReverse = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) =>
        q.eq("employerId", otherUserId).eq("candidateId", userId)
      )
      .first();
    const convId = existing?._id ?? existingReverse?._id ?? await ctx.db.insert("conversations", {
      employerId: userId,
      candidateId: otherUserId,
      jobApplicationId,
    });
    if (initialMessage) {
      await ctx.db.insert("messages", {
        conversationId: convId as typeof convId,
        senderId: userId,
        content: initialMessage,
        isRead: false,
      });
    }
    return convId;
  },
});
