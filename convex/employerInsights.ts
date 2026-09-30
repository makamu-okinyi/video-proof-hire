import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { KENYA_COUNTIES } from "./lib/kenya";

const DAY_MS = 24 * 60 * 60 * 1000;
const DECIDED = new Set(["shortlisted", "rejected"]);

export const CRITERIA = ["communication", "technical", "problemSolving", "roleFit", "presentation"] as const;

/** The signed-in employer's jobs, each with its applications. Never throws; empty when signed out. */
async function employerApplications(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return { userId: null, jobs: [] as Doc<"jobPostings">[], apps: [] as Doc<"jobApplications">[] };
  const jobs = await ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect();
  const lists = await Promise.all(
    jobs.map((j) => ctx.db.query("jobApplications").withIndex("by_jobId", (q) => q.eq("jobId", j._id)).collect())
  );
  return { userId: userId as string, jobs, apps: lists.flat() };
}

/** When an application was first shortlisted or rejected, from its recorded status changes. */
function decidedAt(app: Doc<"jobApplications">): number | null {
  const first = (app.statusHistory ?? []).find((h) => DECIDED.has(h.status) && h.at >= app._creationTime);
  return first ? first.at : null;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/**
 * Days from "applied" to the first shortlist or reject decision, computed only from the recorded
 * timestamps of real status changes. Undecided applications are counted separately, never guessed.
 */
export const decisionTimes = query({
  args: {},
  handler: async (ctx) => {
    const { jobs, apps } = await employerApplications(ctx);
    const days: number[] = [];
    const perJob = new Map<string, number[]>();
    let undecided = 0;
    for (const a of apps) {
      const at = decidedAt(a);
      if (at === null) {
        undecided++;
        continue;
      }
      const d = (at - a._creationTime) / DAY_MS;
      days.push(d);
      const list = perJob.get(a.jobId) ?? [];
      list.push(d);
      perJob.set(a.jobId, list);
    }
    const avg = days.length ? days.reduce((x, y) => x + y, 0) / days.length : null;
    return {
      decided: days.length,
      undecided,
      averageDays: round1(avg),
      medianDays: round1(median(days)),
      fastestDays: days.length ? round1(Math.min(...days)) : null,
      slowestDays: days.length ? round1(Math.max(...days)) : null,
      byJob: jobs
        .map((j) => {
          const ds = perJob.get(j._id) ?? [];
          return { jobId: j._id, title: j.title, decided: ds.length, averageDays: round1(ds.length ? ds.reduce((x, y) => x + y, 0) / ds.length : null) };
        })
        .filter((j) => j.decided > 0)
        .sort((a, b) => (b.averageDays ?? 0) - (a.averageDays ?? 0)),
    };
  },
});

/** Where this employer's applicants are, from the county or country each entered on their profile. */
export const applicantCounties = query({
  args: {},
  handler: async (ctx) => {
    const { apps } = await employerApplications(ctx);
    const applicantIds = [...new Set(apps.map((a) => a.applicantId))];
    const profiles = await Promise.all(
      applicantIds.map((id) => ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", id)).first())
    );
    const byCounty = new Map<string, number>(KENYA_COUNTIES.map((c) => [c, 0]));
    const outside = new Map<string, number>();
    let unknown = 0;
    for (const p of profiles) {
      if (p?.county && byCounty.has(p.county)) byCounty.set(p.county, byCounty.get(p.county)! + 1);
      else if (p?.country && p.country.trim() && p.country.trim().toLowerCase() !== "kenya") {
        const c = p.country.trim();
        outside.set(c, (outside.get(c) ?? 0) + 1);
      } else unknown++;
    }
    return {
      total: applicantIds.length,
      inKenya: [...byCounty.values()].reduce((a, b) => a + b, 0),
      outsideKenya: [...outside.values()].reduce((a, b) => a + b, 0),
      unknown,
      counties: [...byCounty.entries()].map(([county, count]) => ({ county, count })),
    };
  },
});

async function ownedApplication(ctx: QueryCtx, applicationId: Id<"jobApplications">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const app = await ctx.db.get(applicationId);
  if (!app) throw new Error("Application not found");
  const job = await ctx.db.get(app.jobId);
  if (!job || job.employerId !== userId) throw new Error("Not authorized");
  return { userId: userId as string, app, job };
}

/** Everything a reviewer needs on one applicant: profile, skill match, history, assessment and videos. */
export const dossier = query({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }) => {
    const { userId, app, job } = await ownedApplication(ctx, applicationId);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", app.applicantId)).first();
    const videos = await ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", app.applicantId)).take(6);
    const assessments = await ctx.db.query("applicationAssessments").withIndex("by_applicationId", (q) => q.eq("applicationId", applicationId)).collect();
    const mine = assessments.find((a) => a.reviewerId === userId) ?? null;

    const have = new Set((profile?.skills ?? []).map((s) => s.trim().toLowerCase()));
    const required = job.skillsRequired ?? [];
    const matched = required.filter((s) => have.has(s.trim().toLowerCase()));
    const missing = required.filter((s) => !have.has(s.trim().toLowerCase()));

    const team = CRITERIA.map((c) => ({
      criterion: c,
      average: assessments.length ? Math.round((assessments.reduce((t, a) => t + a.scores[c], 0) / assessments.length) * 10) / 10 : null,
    }));

    return {
      application: {
        id: app._id,
        status: app.status,
        appliedAt: app._creationTime,
        coverMessage: app.coverMessage ?? null,
        history: (app.statusHistory ?? [{ status: "pending", at: app._creationTime }]).map((h) => ({ status: h.status, at: h.at })),
      },
      job: { id: job._id, title: job.title, skillsRequired: required },
      applicant: {
        userId: app.applicantId,
        username: profile?.username ?? null,
        fullName: profile?.fullName ?? null,
        avatar: profile?.avatar ?? null,
        bio: profile?.bio ?? null,
        skills: profile?.skills ?? [],
        county: profile?.county ?? null,
        country: profile?.country ?? null,
        isVerified: profile?.isVerified ?? false,
      },
      skillMatch: { matched, missing, required: required.length },
      videos: videos.map((x) => ({ id: x._id, title: x.title ?? null, thumbnailUrl: x.thumbnailUrl ?? null, views: x.views })),
      assessment: mine ? { scores: mine.scores, note: mine.note ?? "", updatedAt: mine.updatedAt } : null,
      team: { reviewers: assessments.length, averages: team },
    };
  },
});

const score = v.number();

/** Save (or update) the signed-in reviewer's structured assessment. Scores are whole numbers 1 to 5. */
export const saveAssessment = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    scores: v.object({ communication: score, technical: score, problemSolving: score, roleFit: score, presentation: score }),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, scores, note }) => {
    const { userId } = await ownedApplication(ctx, applicationId);
    for (const c of CRITERIA) {
      const s = scores[c];
      if (!Number.isInteger(s) || s < 1 || s > 5) throw new Error("Scores must be whole numbers from 1 to 5");
    }
    const cleanNote = note?.trim().slice(0, 1000) || undefined;
    const existing = await ctx.db
      .query("applicationAssessments")
      .withIndex("by_application_reviewer", (q) => q.eq("applicationId", applicationId).eq("reviewerId", userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { scores, note: cleanNote, updatedAt: Date.now() });
    else await ctx.db.insert("applicationAssessments", { applicationId, reviewerId: userId, scores, note: cleanNote, updatedAt: Date.now() });
  },
});
