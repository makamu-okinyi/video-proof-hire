import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveJobs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return await ctx.db
      .query("jobPostings")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);
  },
});

export const getEmployerJobs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("jobPostings")
      .withIndex("by_employerId", (q) => q.eq("employerId", userId))
      .order("desc")
      .collect();
  },
});

export const getJob = query({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    jobType: v.string(),
    location: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    experienceLevel: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    skillsRequired: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    applicationDeadline: v.optional(v.string()),
    videoPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("jobPostings", { ...args, employerId: userId, isActive: true });
  },
});

export const updateJob = mutation({
  args: {
    jobId: v.id("jobPostings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    jobType: v.optional(v.string()),
    location: v.optional(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    experienceLevel: v.optional(v.string()),
    skillsRequired: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    applicationDeadline: v.optional(v.string()),
    videoPrompt: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { jobId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const job = await ctx.db.get(jobId);
    if (!job || job.employerId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(jobId, Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ));
  },
});

export const applyToJob = mutation({
  args: {
    jobId: v.id("jobPostings"),
    coverMessage: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, coverMessage }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_jobId_applicantId", (q) =>
        q.eq("jobId", jobId).eq("applicantId", userId)
      )
      .first();
    if (existing) throw new Error("Already applied");
    return await ctx.db.insert("jobApplications", {
      jobId,
      applicantId: userId,
      status: "pending",
      coverMessage,
    });
  },
});

export const getJobApplications = query({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const job = await ctx.db.get(jobId);
    if (!job || job.employerId !== userId) return [];
    return await ctx.db
      .query("jobApplications")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .collect();
  },
});

export const getJobApplicantsDetailed = query({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const job = await ctx.db.get(jobId);
    if (!job || job.employerId !== userId) return [];
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
      .order("desc")
      .collect();
    return await Promise.all(
      applications.map(async (appRow) => {
        const applicant = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", appRow.applicantId))
          .first();
        const videos = await ctx.db
          .query("videos")
          .withIndex("by_userId", (q) => q.eq("userId", appRow.applicantId))
          .filter((q) => q.eq(q.field("isPrivate"), false))
          .order("desc")
          .take(6);
        return { ...appRow, applicant, videos };
      })
    );
  },
});

export const getAllApplicationsForEmployer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const jobs = await ctx.db
      .query("jobPostings")
      .withIndex("by_employerId", (q) => q.eq("employerId", userId))
      .collect();
    const jobIds = jobs.map((j) => j._id);
    const applications = await Promise.all(
      jobIds.map((jobId) =>
        ctx.db
          .query("jobApplications")
          .withIndex("by_jobId", (q) => q.eq("jobId", jobId))
          .collect()
      )
    );
    return applications.flat();
  },
});

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_applicantId", (q) => q.eq("applicantId", userId))
      .collect();
    return await Promise.all(
      apps.map(async (app) => ({
        ...app,
        job: await ctx.db.get(app.jobId),
      }))
    );
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: v.string(),
  },
  handler: async (ctx, { applicationId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    const job = await ctx.db.get(app.jobId);
    if (!job || job.employerId !== userId) throw new Error("Not authorized");
    await ctx.db.patch(applicationId, { status });
  },
});

export const getEmployerAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { jobs: 0, applications: 0, challenges: 0 };
    const [jobs, challenges] = await Promise.all([
      ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
      ctx.db.query("challenges").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
    ]);
    const jobIds = jobs.map((j) => j._id);
    const allApps = await Promise.all(
      jobIds.map((jobId) =>
        ctx.db.query("jobApplications").withIndex("by_jobId", (q) => q.eq("jobId", jobId)).collect()
      )
    );
    return {
      jobs: jobs.length,
      applications: allApps.flat().length,
      challenges: challenges.length,
    };
  },
});

export const hasApplied = query({
  args: { jobId: v.id("jobPostings") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_jobId_applicantId", (q) =>
        q.eq("jobId", jobId).eq("applicantId", userId)
      )
      .first();
    return !!existing;
  },
});
