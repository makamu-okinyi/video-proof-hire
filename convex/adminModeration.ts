import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logAdminAction } from "./lib/admin";

async function employerName(ctx: QueryCtx, employerId: string): Promise<string | null> {
  const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", employerId)).first();
  return p?.companyName || p?.fullName || p?.username || null;
}

export const listJobs = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const jobs = await ctx.db.query("jobPostings").order("desc").take(1000);
    return await Promise.all(
      jobs.map(async (j) => {
        const apps = await ctx.db.query("jobApplications").withIndex("by_jobId", (q) => q.eq("jobId", j._id)).collect();
        return {
          id: j._id,
          title: j.title,
          company: j.companyName ?? (await employerName(ctx, j.employerId)),
          location: j.location ?? null,
          jobType: j.jobType,
          isActive: j.isActive,
          hidden: !!j.adminHidden,
          featured: !!j.isFeatured,
          applicants: apps.length,
          createdAt: j._creationTime,
        };
      })
    );
  },
});

export const listChallenges = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("challenges").order("desc").take(1000);
    return await Promise.all(
      rows.map(async (c) => {
        const subs = await ctx.db.query("challengeSubmissions").withIndex("by_challengeId", (q) => q.eq("challengeId", c._id)).collect();
        return {
          id: c._id,
          title: c.title,
          company: await employerName(ctx, c.employerId),
          deadline: c.deadline ?? null,
          isActive: c.isActive,
          hidden: !!c.adminHidden,
          featured: c.isFeatured,
          submissions: subs.length,
          createdAt: c._creationTime,
        };
      })
    );
  },
});

export const setJobHidden = mutation({
  args: { jobId: v.id("jobPostings"), hidden: v.boolean() },
  handler: async (ctx, { jobId, hidden }) => {
    const adminId = await requireAdmin(ctx);
    const j = await ctx.db.get(jobId);
    if (!j) throw new Error("Job not found");
    await ctx.db.patch(jobId, { adminHidden: hidden });
    await logAdminAction(ctx, adminId, hidden ? "job_unpublished" : "job_republished", { detail: `${j.title} (${jobId})` });
  },
});

export const setJobFeatured = mutation({
  args: { jobId: v.id("jobPostings"), featured: v.boolean() },
  handler: async (ctx, { jobId, featured }) => {
    const adminId = await requireAdmin(ctx);
    const j = await ctx.db.get(jobId);
    if (!j) throw new Error("Job not found");
    await ctx.db.patch(jobId, { isFeatured: featured });
    await logAdminAction(ctx, adminId, featured ? "job_featured" : "job_unfeatured", { detail: `${j.title} (${jobId})` });
  },
});

export const deleteJob = mutation({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, { jobId }) => {
    const adminId = await requireAdmin(ctx);
    const j = await ctx.db.get(jobId);
    if (!j) throw new Error("Job not found");
    const apps = await ctx.db.query("jobApplications").withIndex("by_jobId", (q) => q.eq("jobId", jobId)).collect();
    await Promise.all(apps.map((a) => ctx.db.delete(a._id)));
    await ctx.db.delete(jobId);
    await logAdminAction(ctx, adminId, "job_deleted", { detail: `${j.title} (${jobId}) with ${apps.length} applications` });
  },
});

export const setChallengeHidden = mutation({
  args: { challengeId: v.id("challenges"), hidden: v.boolean() },
  handler: async (ctx, { challengeId, hidden }) => {
    const adminId = await requireAdmin(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c) throw new Error("Challenge not found");
    await ctx.db.patch(challengeId, { adminHidden: hidden });
    await logAdminAction(ctx, adminId, hidden ? "challenge_unpublished" : "challenge_republished", { detail: `${c.title} (${challengeId})` });
  },
});

export const setChallengeFeatured = mutation({
  args: { challengeId: v.id("challenges"), featured: v.boolean() },
  handler: async (ctx, { challengeId, featured }) => {
    const adminId = await requireAdmin(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c) throw new Error("Challenge not found");
    await ctx.db.patch(challengeId, { isFeatured: featured });
    await logAdminAction(ctx, adminId, featured ? "challenge_featured" : "challenge_unfeatured", { detail: `${c.title} (${challengeId})` });
  },
});

export const deleteChallenge = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const adminId = await requireAdmin(ctx);
    const c = await ctx.db.get(challengeId);
    if (!c) throw new Error("Challenge not found");
    const subs = await ctx.db.query("challengeSubmissions").withIndex("by_challengeId", (q) => q.eq("challengeId", challengeId)).collect();
    await Promise.all(subs.map((s) => ctx.db.delete(s._id)));
    await ctx.db.delete(challengeId);
    await logAdminAction(ctx, adminId, "challenge_deleted", { detail: `${c.title} (${challengeId}) with ${subs.length} submissions` });
  },
});
