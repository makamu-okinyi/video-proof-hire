import { query, mutation, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id, TableNames } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logAdminAction } from "./lib/admin";

/**
 * Data-subject rights: export and erasure of the signed-in user's own data.
 *
 * RETENTION EXCEPTIONS (kept after erasure, documented in the Privacy Policy):
 *  - adminAuditLog entries that reference the account id (security / accountability record).
 *  - Messages the user wrote inside conversations with other people are kept in place but their
 *    text is replaced with "[message deleted]" and the row is unlinked from the account, so the
 *    other participant's history remains intact without the erased user's words.
 *  - Aggregate, anonymous analytics events (they contain no user id, IP or other identifier).
 *  - Anything we are legally required to retain.
 */

const BATCH = 400;

export const exportMyData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    const [profile, videos, applications, submissions, founders, passkeys, jobs, challenges, employer, shortlists, saved, likes, comments, notifications, bookmarks, asEmployer, asCandidate] =
      await Promise.all([
        ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first(),
        ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("jobApplications").withIndex("by_applicantId", (q) => q.eq("applicantId", userId)).collect(),
        ctx.db.query("challengeSubmissions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("ventureFounders").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("passkeys").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
        ctx.db.query("challenges").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
        ctx.db.query("employerProfiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first(),
        ctx.db.query("shortlists").withIndex("by_recruiterId", (q) => q.eq("recruiterId", userId)).collect(),
        ctx.db.query("savedVideos").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("videoLikes").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("videoComments").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("investorBookmarks").withIndex("by_investorId", (q) => q.eq("investorId", userId)).collect(),
        ctx.db.query("conversations").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
        ctx.db.query("conversations").withIndex("by_candidateId", (q) => q.eq("candidateId", userId)).collect(),
      ]);

    const ventures = await Promise.all(founders.map((f) => ctx.db.get(f.ventureId)));
    const messages: { conversationId: string; content: string; sentAt: string }[] = [];
    for (const c of [...asEmployer, ...asCandidate]) {
      const rows = await ctx.db.query("messages").withIndex("by_conversationId", (q) => q.eq("conversationId", c._id)).collect();
      for (const m of rows) if (m.senderId === userId) messages.push({ conversationId: c._id, content: m.content, sentAt: new Date(m._creationTime).toISOString() });
    }
    const iso = (t: number) => new Date(t).toISOString();

    return {
      exportedAt: new Date().toISOString(),
      note: "This file contains the personal data Donjo holds about your account. Passkey public keys and password hashes are intentionally excluded.",
      account: { id: userId, email: user?.email ?? null, createdAt: user ? iso(user._creationTime) : null },
      profile: profile ? { ...profile, createdAt: iso(profile._creationTime) } : null,
      employerProfile: employer,
      videos: videos.map((x) => ({ id: x._id, title: x.title, description: x.description, videoUrl: x.videoUrl, skillCategory: x.skillCategory, isPrivate: x.isPrivate, views: x.views, likes: x.likes, createdAt: iso(x._creationTime) })),
      jobApplications: applications.map((a) => ({ id: a._id, jobId: a.jobId, status: a.status, coverMessage: a.coverMessage, appliedAt: iso(a._creationTime) })),
      challengeSubmissions: submissions.map((s) => ({ id: s._id, challengeId: s.challengeId, videoId: s.videoId, status: s.status, submittedAt: iso(s._creationTime) })),
      ventures: ventures.filter(Boolean).map((x) => ({ id: x!._id, name: x!.name, tagline: x!.tagline, stage: x!.stage, reviewStatus: x!.reviewStatus, county: x!.county, country: x!.country, createdAt: iso(x!._creationTime) })),
      jobPostings: jobs.map((j) => ({ id: j._id, title: j.title, description: j.description, isActive: j.isActive, createdAt: iso(j._creationTime) })),
      challengesCreated: challenges.map((c) => ({ id: c._id, title: c.title, description: c.description, isActive: c.isActive, createdAt: iso(c._creationTime) })),
      messagesYouWrote: messages,
      comments: comments.map((c) => ({ videoId: c.videoId, content: c.content, createdAt: iso(c._creationTime) })),
      likedVideoIds: likes.map((l) => l.videoId),
      savedVideoIds: saved.map((s) => s.videoId),
      shortlistedTalentIds: shortlists.map((s) => s.talentId),
      investorBookmarks: bookmarks.map((b) => ({ ventureId: b.ventureId, action: b.action, notes: b.notes })),
      notifications: notifications.map((n) => ({ title: n.title, message: n.message, isRead: n.isRead, createdAt: iso(n._creationTime) })),
      passkeys: passkeys.map((p) => ({ deviceLabel: p.deviceLabel, createdAt: iso(p.createdAt), lastUsedAt: p.lastUsedAt ? iso(p.lastUsedAt) : null })),
    };
  },
});

/**
 * Begin erasing the caller's account. The user is signed out everywhere immediately and can no
 * longer act; personal data is then removed in bounded batches by eraseUserData.
 */
export const deleteMyAccount = mutation({
  args: { confirm: v.literal("DELETE") },
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile?.userType === "admin") {
      throw new Error("Admin accounts cannot be deleted here. Ask another admin to revoke your admin access first.");
    }
    // Lock the account and revoke sessions right away.
    if (profile) await ctx.db.patch(profile._id, { status: "suspended", suspendedAt: Date.now(), suspendedReason: "Account deletion requested by the user" });
    const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    for (const s of sessions) {
      const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect();
      await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));
      await ctx.db.delete(s._id);
    }
    await logAdminAction(ctx, userId, "account_deletion_requested", { detail: "self-service" });
    await ctx.scheduler.runAfter(0, internal.account.eraseUserData, { userId });
    return { scheduled: true };
  },
});

async function deleteAll(ctx: MutationCtx, rows: { _id: Id<TableNames> }[]): Promise<boolean> {
  await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
  return rows.length >= BATCH;
}

export const eraseUserData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    let more = false;
    const id = userId as string;

    // Videos (+ files and per-video interactions)
    const videos = await ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH);
    for (const vid of videos) {
      for (const idx of ["by_videoId"] as const) {
        const likes = await ctx.db.query("videoLikes").withIndex(idx, (q) => q.eq("videoId", vid._id)).collect();
        const comments = await ctx.db.query("videoComments").withIndex(idx, (q) => q.eq("videoId", vid._id)).collect();
        const saves = await ctx.db.query("savedVideos").withIndex("by_videoId_userId", (q) => q.eq("videoId", vid._id)).collect();
        const views = await ctx.db.query("videoViews").withIndex(idx, (q) => q.eq("videoId", vid._id)).collect();
        await Promise.all([...likes, ...comments, ...saves, ...views].map((r) => ctx.db.delete(r._id)));
      }
      if (vid.storageId) await ctx.storage.delete(vid.storageId).catch(() => undefined);
      await ctx.db.delete(vid._id);
    }
    more = videos.length >= BATCH || more;

    more = (await deleteAll(ctx, await ctx.db.query("videoLikes").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("videoComments").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("savedVideos").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("jobApplications").withIndex("by_applicantId", (q) => q.eq("applicantId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("challengeSubmissions").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("investorBookmarks").withIndex("by_investorId", (q) => q.eq("investorId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("shortlists").withIndex("by_recruiterId", (q) => q.eq("recruiterId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("shortlists").withIndex("by_talentId", (q) => q.eq("talentId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("hiringLeads").withIndex("by_recruiterId", (q) => q.eq("recruiterId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("hiringLeads").withIndex("by_talentId", (q) => q.eq("talentId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("feedback").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("passkeys").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH))) || more;
    more = (await deleteAll(ctx, await ctx.db.query("employerProfiles").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH))) || more;

    // Employer content: jobs (and their applications) and challenges (and their entries)
    const jobs = await ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", id)).take(BATCH);
    for (const j of jobs) {
      const apps = await ctx.db.query("jobApplications").withIndex("by_jobId", (q) => q.eq("jobId", j._id)).collect();
      await Promise.all(apps.map((a) => ctx.db.delete(a._id)));
      await ctx.db.delete(j._id);
    }
    const chs = await ctx.db.query("challenges").withIndex("by_employerId", (q) => q.eq("employerId", id)).take(BATCH);
    for (const c of chs) {
      const subs = await ctx.db.query("challengeSubmissions").withIndex("by_challengeId", (q) => q.eq("challengeId", c._id)).collect();
      await Promise.all(subs.map((s) => ctx.db.delete(s._id)));
      await ctx.db.delete(c._id);
    }
    more = jobs.length >= BATCH || chs.length >= BATCH || more;

    // Ventures: remove the founder link; delete ventures left without any founder.
    const founderRows = await ctx.db.query("ventureFounders").withIndex("by_userId", (q) => q.eq("userId", id)).take(BATCH);
    for (const f of founderRows) {
      await ctx.db.delete(f._id);
      const remaining = await ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", f.ventureId)).first();
      if (!remaining) {
        const decks = await ctx.db.query("pitchDecks").withIndex("by_ventureId", (q) => q.eq("ventureId", f.ventureId)).collect();
        for (const d of decks) {
          if (d.storageId) await ctx.storage.delete(d.storageId).catch(() => undefined);
          await ctx.db.delete(d._id);
        }
        await ctx.db.delete(f.ventureId);
      }
    }
    more = founderRows.length >= BATCH || more;

    // Conversations: redact what the user wrote and unlink them (see retention exceptions).
    for (const idx of ["by_employerId", "by_candidateId"] as const) {
      const convs = await ctx.db.query("conversations").withIndex(idx, (q) => q.eq(idx === "by_employerId" ? "employerId" : "candidateId", id)).take(BATCH);
      for (const c of convs) {
        const msgs = await ctx.db.query("messages").withIndex("by_conversationId", (q) => q.eq("conversationId", c._id)).collect();
        for (const m of msgs) if (m.senderId === id) await ctx.db.patch(m._id, { content: "[message deleted]", senderId: "deleted-user" });
        await ctx.db.patch(c._id, idx === "by_employerId" ? { employerId: "deleted-user" } : { candidateId: "deleted-user" });
      }
      more = convs.length >= BATCH || more;
    }

    if (more) {
      await ctx.scheduler.runAfter(0, internal.account.eraseUserData, { userId });
      return;
    }

    // Everything else: profile, auth records, then the account itself.
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", id)).first();
    if (profile) await ctx.db.delete(profile._id);
    const accounts = await ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).collect();
    for (const a of accounts) {
      const codes = await ctx.db.query("authVerificationCodes").withIndex("accountId", (q) => q.eq("accountId", a._id)).collect();
      await Promise.all(codes.map((c) => ctx.db.delete(c._id)));
      await ctx.db.delete(a._id);
    }
    const sessions = await ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    for (const s of sessions) {
      const tokens = await ctx.db.query("authRefreshTokens").withIndex("sessionId", (q) => q.eq("sessionId", s._id)).collect();
      await Promise.all(tokens.map((t) => ctx.db.delete(t._id)));
      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(userId);
    await logAdminAction(ctx, id, "account_erased", { detail: "personal data removed; audit and redacted messages retained" });
  },
});
