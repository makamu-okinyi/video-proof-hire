import { query } from "./_generated/server";
import { requireAdmin } from "./lib/admin";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function median(nums: number[]) {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const mean = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);
const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

const AGING = [
  { label: "Under 1 day", max: 1 * DAY },
  { label: "1-3 days", max: 3 * DAY },
  { label: "3-7 days", max: 7 * DAY },
  { label: "1-2 weeks", max: 14 * DAY },
  { label: "Over 2 weeks", max: Infinity },
];

function ageBuckets(pendingSince: number[], now: number) {
  const counts = AGING.map((b) => ({ label: b.label, count: 0 }));
  for (const at of pendingSince) {
    const age = now - at;
    const i = AGING.findIndex((b) => age < b.max);
    counts[i === -1 ? counts.length - 1 : i].count++;
  }
  return counts;
}

function weeklySeries(times: number[], now: number, weeks = 12) {
  const out: { weekStart: number; count: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ weekStart: now - (i + 1) * WEEK, count: 0 });
  for (const t of times) {
    const idx = out.findIndex((w) => t >= w.weekStart && t < w.weekStart + WEEK);
    if (idx >= 0) out[idx].count++;
  }
  return out;
}

/** Venture review velocity, computed only from recorded status history. */
export const ventures = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const all = await ctx.db.query("ventures").take(5000);

    const decisionHours: number[] = [];
    const decisionTimes: number[] = [];
    const perReviewer = new Map<string, { hours: number[]; count: number }>();
    const pendingSince: number[] = [];
    let shortlisted = 0;
    let rejected = 0;

    for (const x of all) {
      const history = x.statusHistory ?? [{ status: "submitted", at: x._creationTime }];
      const submittedAt = history[0].at;
      const first = history.find((h) => h.status === "shortlisted" || h.status === "rejected");
      if (first) {
        const hours = (first.at - submittedAt) / HOUR;
        decisionHours.push(hours);
        decisionTimes.push(first.at);
        if (first.by) {
          const r = perReviewer.get(first.by) ?? { hours: [], count: 0 };
          r.hours.push(hours);
          r.count++;
          perReviewer.set(first.by, r);
        }
      }
      if (x.reviewStatus === "shortlisted") shortlisted++;
      else if (x.reviewStatus === "rejected") rejected++;
      else if (x.reviewStatus === "submitted") {
        const since = [...history].reverse().find((h) => h.status === "submitted")?.at ?? x._creationTime;
        pendingSince.push(since);
      }
    }

    const reviewers = await Promise.all(
      [...perReviewer.entries()].map(async ([id, r]) => {
        const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", id)).first();
        return {
          reviewer: p?.fullName || p?.username || "Admin",
          decisions: r.count,
          medianHours: round1(median(r.hours)),
        };
      })
    );

    return {
      total: all.length,
      decided: decisionHours.length,
      medianHoursToDecision: round1(median(decisionHours)),
      meanHoursToDecision: round1(mean(decisionHours)),
      funnel: [
        { key: "submitted", label: "Submitted", count: all.length },
        { key: "decided", label: "Decided", count: shortlisted + rejected },
        { key: "shortlisted", label: "Shortlisted", count: shortlisted },
        { key: "rejected", label: "Rejected", count: rejected },
      ],
      pending: pendingSince.length,
      aging: ageBuckets(pendingSince, now),
      decisionsPerWeek: weeklySeries(decisionTimes, now),
      reviewers: reviewers.sort((a, b) => b.decisions - a.decisions),
    };
  },
});

/** Job-application response velocity (time from applying to the first status change). */
export const applications = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const all = await ctx.db.query("jobApplications").take(10000);
    const hours: number[] = [];
    const times: number[] = [];
    const pendingSince: number[] = [];
    const statusCounts: Record<string, number> = {};
    for (const a of all) {
      statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
      const history = a.statusHistory ?? [{ status: "pending", at: a._creationTime }];
      const appliedAt = history[0].at;
      const first = history.slice(1).find((h) => h.status !== "pending");
      if (first) {
        hours.push((first.at - appliedAt) / HOUR);
        times.push(first.at);
      } else if (a.status === "pending") {
        pendingSince.push(appliedAt);
      }
    }
    return {
      total: all.length,
      responded: hours.length,
      medianHoursToResponse: round1(median(hours)),
      meanHoursToResponse: round1(mean(hours)),
      statusCounts,
      pending: pendingSince.length,
      aging: ageBuckets(pendingSince, now),
      responsesPerWeek: weeklySeries(times, now),
    };
  },
});
