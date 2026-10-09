import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/admin";

const DAY = 24 * 60 * 60 * 1000;
const CAP = 10000;

type Counted = { count: number; capped: boolean };
const counted = (n: number): Counted => ({ count: Math.min(n, CAP), capped: n > CAP });

export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();

    const [users, profiles, ventures, activeJobs, applications, activeChallenges, submissions, videos, conversations, messages, notifications] =
      await Promise.all([
        ctx.db.query("users").order("desc").take(CAP + 1),
        ctx.db.query("profiles").take(CAP + 1),
        ctx.db.query("ventures").take(CAP + 1),
        ctx.db.query("jobPostings").withIndex("by_isActive", (q) => q.eq("isActive", true)).take(CAP + 1),
        ctx.db.query("jobApplications").take(CAP + 1),
        ctx.db.query("challenges").withIndex("by_isActive", (q) => q.eq("isActive", true)).take(CAP + 1),
        ctx.db.query("challengeSubmissions").take(CAP + 1),
        ctx.db.query("videos").take(CAP + 1),
        ctx.db.query("conversations").take(CAP + 1),
        ctx.db.query("messages").take(CAP + 1),
        ctx.db.query("notifications").take(CAP + 1),
      ]);

    const roleCounts: Record<string, number> = {};
    for (const p of profiles) {
      const r = p.userType ?? "unassigned";
      roleCounts[r] = (roleCounts[r] ?? 0) + 1;
    }
    roleCounts["unassigned"] = (roleCounts["unassigned"] ?? 0) + Math.max(0, users.length - profiles.length);

    const ventureStatus: Record<string, number> = {};
    for (const vn of ventures) ventureStatus[vn.reviewStatus] = (ventureStatus[vn.reviewStatus] ?? 0) + 1;

    // Signups per day for the last 14 days (East Africa Time buckets).
    const eat = (t: number) => new Date(t + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const perDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) perDay.set(eat(now - i * DAY), 0);
    for (const u of users) {
      const d = eat(u._creationTime);
      if (perDay.has(d)) perDay.set(d, perDay.get(d)! + 1);
    }

    const pending = ventures.filter((x) => x.reviewStatus === "submitted");
    const oldest = pending.reduce<number | null>(
      (min, x) => {
        const at = x.statusHistory?.filter((h) => h.status === "submitted").at(-1)?.at ?? x._creationTime;
        return min === null || at < min ? at : min;
      },
      null
    );

    return {
      users: {
        total: counted(users.length),
        byRole: roleCounts,
        last7d: users.filter((u) => u._creationTime >= now - 7 * DAY).length,
        last30d: users.filter((u) => u._creationTime >= now - 30 * DAY).length,
        signupSeries: [...perDay.entries()].map(([day, count]) => ({ day, count })),
      },
      ventures: { total: counted(ventures.length), byStatus: ventureStatus },
      jobs: { active: counted(activeJobs.length), applications: counted(applications.length) },
      challenges: { active: counted(activeChallenges.length), submissions: counted(submissions.length) },
      videos: counted(videos.length),
      messaging: { conversations: counted(conversations.length), messages: counted(messages.length) },
      unreadNotifications: counted(notifications.filter((n) => !n.isRead).length),
      attention: {
        pendingFeedback: (await ctx.db.query("feedback").withIndex("by_status", (q) => q.eq("status", "pending")).take(100)).length,
        pendingPlanRequests: (await ctx.db.query("planRequests").withIndex("by_status", (q) => q.eq("status", "pending")).take(100)).length,
        pendingReviews: pending.length,
        oldestPendingAt: oldest,
        pendingOver7d: pending.filter((x) => {
          const at = x.statusHistory?.filter((h) => h.status === "submitted").at(-1)?.at ?? x._creationTime;
          return at < now - 7 * DAY;
        }).length,
      },
    };
  },
});

/** Recent signups, applications and review decisions. */
export const activity = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [users, apps, reviews] = await Promise.all([
      ctx.db.query("users").order("desc").take(6),
      ctx.db.query("jobApplications").order("desc").take(6),
      ctx.db.query("adminAuditLog").withIndex("by_at").order("desc").filter((q) => q.eq(q.field("action"), "venture_review")).take(6),
    ]);
    const nameOf = async (userId: string) => {
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
      return p?.fullName || p?.username || null;
    };
    const signups = await Promise.all(
      users.map(async (u) => ({
        at: u._creationTime,
        who: (await nameOf(u._id)) ?? u.email ?? "New user",
        role: (await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", u._id)).first())?.userType ?? "unassigned",
      }))
    );
    const applications = await Promise.all(
      apps.map(async (a) => {
        const job = await ctx.db.get(a.jobId);
        return { at: a._creationTime, who: (await nameOf(a.applicantId)) ?? "An applicant", job: job?.title ?? "a job" };
      })
    );
    return {
      signups,
      applications,
      reviews: reviews.map((r) => ({ at: r.at, detail: r.detail ?? "" })),
    };
  },
});

/** Global search across users, ventures and jobs (bounded scan, case-insensitive substring). */
export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    await requireAdmin(ctx);
    const term = q.trim().toLowerCase();
    if (term.length < 2) return { users: [], ventures: [], jobs: [] };
    const [users, profiles, ventures, jobs] = await Promise.all([
      ctx.db.query("users").order("desc").take(1000),
      ctx.db.query("profiles").take(1000),
      ctx.db.query("ventures").order("desc").take(500),
      ctx.db.query("jobPostings").order("desc").take(500),
    ]);
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));
    const userHits = users
      .map((u) => ({ u, p: profileByUser.get(u._id) }))
      .filter(({ u, p }) =>
        [u.email, u.name, p?.username, p?.fullName, p?.companyName].some((s) => s?.toLowerCase().includes(term))
      )
      .slice(0, 5)
      .map(({ u, p }) => ({ id: u._id, email: u.email ?? null, name: p?.fullName || p?.username || u.name || null, role: p?.userType ?? "unassigned" }));
    return {
      users: userHits,
      ventures: ventures
        .filter((x) => [x.name, x.tagline].some((s) => s.toLowerCase().includes(term)))
        .slice(0, 5)
        .map((x) => ({ id: x._id, name: x.name, status: x.reviewStatus })),
      jobs: jobs
        .filter((x) => [x.title, x.companyName].some((s) => s?.toLowerCase().includes(term)))
        .slice(0, 5)
        .map((x) => ({ id: x._id, title: x.title, company: x.companyName ?? null })),
    };
  },
});
