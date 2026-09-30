import { mutation, query, internalMutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin, logAdminAction } from "./lib/admin";
import { countryFromTimezone } from "./lib/tz";

const DAY = 24 * 60 * 60 * 1000;
const EAT_OFFSET = 3 * 60 * 60 * 1000; // Africa/Nairobi is UTC+3 year-round
const QUERY_CAP = 12000; // max events read by one dashboard query (result says when truncated)
export const DEFAULT_RETENTION_DAYS = 90;
const RATE_LIMIT_PER_MINUTE = 60;

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const cut = (s: string | undefined, n: number) => (s ? s.slice(0, n) : undefined);

// ---------------------------------------------------------------------------
// Ingest (public, anonymous). No IPs, no PII, no user ids are stored.
// ---------------------------------------------------------------------------

export const track = mutation({
  args: {
    visitorId: v.string(),
    sessionId: v.string(),
    isNewVisitor: v.boolean(),
    device: v.string(),
    browser: v.string(),
    os: v.string(),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    referrerHost: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    events: v.array(
      v.object({
        type: v.union(v.literal("pageview"), v.literal("event")),
        name: v.optional(v.string()),
        path: v.string(),
      })
    ),
  },
  handler: async (ctx, a) => {
    if (!ID_RE.test(a.visitorId) || !ID_RE.test(a.sessionId)) return { accepted: 0 };
    if (a.events.length === 0 || a.events.length > 10) return { accepted: 0 };

    // Per-visitor rate limit.
    const now = Date.now();
    const recent = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_visitor_at", (q) => q.eq("visitorId", a.visitorId).gte("at", now - 60_000))
      .take(RATE_LIMIT_PER_MINUTE + 1);
    if (recent.length + a.events.length > RATE_LIMIT_PER_MINUTE) return { accepted: 0 };

    let accepted = 0;
    for (const e of a.events) {
      const path = "/" + e.path.replace(/^\/+/, "").split(/[?#]/)[0].slice(0, 200);
      if (path.startsWith("/admin")) continue; // never track the admin console
      const row = {
        type: e.type,
        name: e.type === "event" ? cut(e.name, 40) : undefined,
        visitorId: a.visitorId,
        sessionId: a.sessionId,
        isNewVisitor: a.isNewVisitor,
        path,
        referrerHost: cut(a.referrerHost, 100),
        utmSource: cut(a.utmSource, 60),
        utmMedium: cut(a.utmMedium, 60),
        utmCampaign: cut(a.utmCampaign, 80),
        device: ["mobile", "tablet", "desktop"].includes(a.device) ? a.device : "desktop",
        browser: cut(a.browser, 30) ?? "Other",
        os: cut(a.os, 30) ?? "Other",
        timezone: cut(a.timezone, 60),
        language: cut(a.language, 20),
        at: now,
      };
      await ctx.db.insert("analyticsEvents", row);
      accepted++;
    }

    // Keep "last seen" fresh for signed-in users (at most once per 10 minutes).
    if (accepted > 0) {
      const userId = await getAuthUserId(ctx);
      if (userId) {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first();
        if (profile && (profile.lastSeenAt ?? 0) < now - 10 * 60_000) {
          await ctx.db.patch(profile._id, { lastSeenAt: now });
        }
      }
    }
    return { accepted };
  },
});

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

async function getRetentionDays(ctx: QueryCtx): Promise<number> {
  const row = await ctx.db.query("appSettings").withIndex("by_key", (q) => q.eq("key", "analyticsRetentionDays")).first();
  return row?.value ?? DEFAULT_RETENTION_DAYS;
}

/** Cron: delete analytics rows older than the retention window (bounded batch per run). */
export const prune = internalMutation({
  args: {},
  handler: async (ctx) => {
    const days = await getRetentionDays(ctx);
    const cutoff = Date.now() - days * DAY;
    const old = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_at", (q) => q.lt("at", cutoff))
      .take(2000);
    await Promise.all(old.map((r) => ctx.db.delete(r._id)));
    return old.length;
  },
});

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { retentionDays: await getRetentionDays(ctx) };
  },
});

export const setRetentionDays = mutation({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const adminId = await requireAdmin(ctx);
    if (!Number.isInteger(days) || days < 7 || days > 730) throw new Error("Retention must be 7-730 days");
    const row = await ctx.db.query("appSettings").withIndex("by_key", (q) => q.eq("key", "analyticsRetentionDays")).first();
    if (row) await ctx.db.patch(row._id, { value: days });
    else await ctx.db.insert("appSettings", { key: "analyticsRetentionDays", value: days });
    await logAdminAction(ctx, adminId, "analytics_retention_changed", { detail: `${days} days` });
  },
});

// ---------------------------------------------------------------------------
// Dashboard queries (admin only)
// ---------------------------------------------------------------------------

function eatDay(at: number) {
  return new Date(at + EAT_OFFSET).toISOString().slice(0, 10);
}

function tally<T>(items: T[], key: (t: T) => string | undefined) {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = key(i);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export const summary = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    await requireAdmin(ctx);
    const range = Math.min(Math.max(Math.floor(days), 1), 90);
    const now = Date.now();
    const since = now - Math.max(range, 30) * DAY; // need 30d for MAU regardless of range
    const rows = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_at", (q) => q.gte("at", since))
      .order("desc")
      .take(QUERY_CAP + 1);
    const truncated = rows.length > QUERY_CAP;
    const events = truncated ? rows.slice(0, QUERY_CAP) : rows;

    const rangeStart = now - range * DAY;
    const inRange = events.filter((e) => e.at >= rangeStart);
    const views = inRange.filter((e) => e.type === "pageview");

    const uniq = (list: { visitorId: string }[]) => new Set(list.map((e) => e.visitorId)).size;
    const dau = uniq(events.filter((e) => e.at >= now - DAY));
    const wau = uniq(events.filter((e) => e.at >= now - 7 * DAY));
    const mau = uniq(events.filter((e) => e.at >= now - 30 * DAY));

    // Daily series (East Africa Time), zero-filled.
    const perDay = new Map<string, { pageviews: number; visitors: Set<string> }>();
    for (let i = range - 1; i >= 0; i--) perDay.set(eatDay(now - i * DAY), { pageviews: 0, visitors: new Set() });
    for (const e of inRange) {
      const d = perDay.get(eatDay(e.at));
      if (!d) continue;
      d.visitors.add(e.visitorId);
      if (e.type === "pageview") d.pageviews++;
    }
    const series = [...perDay.entries()].map(([day, d]) => ({ day, pageviews: d.pageviews, visitors: d.visitors.size }));

    // New vs returning visitors within the range.
    const visitorNew = new Map<string, boolean>();
    for (const e of inRange) visitorNew.set(e.visitorId, (visitorNew.get(e.visitorId) ?? false) || e.isNewVisitor);
    const newVisitors = [...visitorNew.values()].filter(Boolean).length;
    const totalVisitors = visitorNew.size;

    const sessions = new Set(inRange.map((e) => e.sessionId)).size;

    // Unique visitors per page for the top pages table.
    const pageVisitors = new Map<string, Set<string>>();
    for (const e of views) {
      if (!pageVisitors.has(e.path)) pageVisitors.set(e.path, new Set());
      pageVisitors.get(e.path)!.add(e.visitorId);
    }
    const topPages = tally(views, (e) => e.path)
      .slice(0, 15)
      .map((p) => ({ path: p.name, views: p.count, visitors: pageVisitors.get(p.name)?.size ?? 0 }));

    // Per-visitor attributes (first event wins) so devices/browsers count people, not hits.
    const firstByVisitor = new Map<string, (typeof inRange)[number]>();
    for (const e of [...inRange].reverse()) if (!firstByVisitor.has(e.visitorId)) firstByVisitor.set(e.visitorId, e);
    const perVisitor = [...firstByVisitor.values()];

    const referrers = tally(
      inRange.filter((e) => e.type === "pageview"),
      (e) => (e.referrerHost ? e.referrerHost : "Direct / none")
    ).slice(0, 10);

    const countries = tally(perVisitor, (e) => countryFromTimezone(e.timezone)).slice(0, 15);
    const timezones = tally(perVisitor, (e) => e.timezone ?? "unknown").slice(0, 15);

    return {
      rangeDays: range,
      truncated,
      hasData: events.length > 0,
      totals: {
        pageviews: views.length,
        visitors: totalVisitors,
        sessions,
        pagesPerSession: sessions ? Math.round((views.length / sessions) * 10) / 10 : 0,
      },
      active: { dau, wau, mau },
      newVsReturning: { new: newVisitors, returning: totalVisitors - newVisitors },
      series,
      topPages,
      referrers,
      devices: tally(perVisitor, (e) => e.device),
      browsers: tally(perVisitor, (e) => e.browser).slice(0, 8),
      operatingSystems: tally(perVisitor, (e) => e.os).slice(0, 8),
      languages: tally(perVisitor, (e) => e.language?.split("-")[0]).slice(0, 8),
      countries,
      timezones,
      utmSources: tally(inRange, (e) => e.utmSource).slice(0, 8),
    };
  },
});

/**
 * Signup funnel. Visit / auth-page numbers come from analytics; signup, profile complete and
 * first action are exact counts from the database for accounts created in the same window.
 * These are aggregate stage counts for the period, not a per-visitor cohort join.
 */
export const funnel = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    await requireAdmin(ctx);
    const range = Math.min(Math.max(Math.floor(days), 1), 90);
    const since = Date.now() - range * DAY;

    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_at", (q) => q.gte("at", since))
      .take(QUERY_CAP);
    const visitors = new Set(events.map((e) => e.visitorId));
    const authVisitors = new Set(events.filter((e) => e.path === "/auth" || e.path.startsWith("/auth/")).map((e) => e.visitorId));

    const users = await ctx.db
      .query("users")
      .order("desc")
      .filter((q) => q.gte(q.field("_creationTime"), since))
      .take(500);

    const byRole = new Map<string, { signups: number; profileComplete: number; firstAction: number }>();
    let profileComplete = 0;
    let firstAction = 0;
    for (const u of users) {
      const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", u._id)).first();
      const role = profile?.userType ?? "unassigned";
      const stat = byRole.get(role) ?? { signups: 0, profileComplete: 0, firstAction: 0 };
      stat.signups++;
      const complete = !!(profile && profile.username && profile.userType);
      if (complete) { profileComplete++; stat.profileComplete++; }
      const acted =
        !!(await ctx.db.query("videos").withIndex("by_userId", (q) => q.eq("userId", u._id)).first()) ||
        !!(await ctx.db.query("jobApplications").withIndex("by_applicantId", (q) => q.eq("applicantId", u._id)).first()) ||
        !!(await ctx.db.query("ventureFounders").withIndex("by_userId", (q) => q.eq("userId", u._id)).first()) ||
        !!(await ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", u._id)).first()) ||
        !!(await ctx.db.query("challengeSubmissions").withIndex("by_userId", (q) => q.eq("userId", u._id)).first());
      if (acted) { firstAction++; stat.firstAction++; }
      byRole.set(role, stat);
    }

    return {
      rangeDays: range,
      cappedUsers: users.length === 500,
      stages: [
        { key: "visit", label: "Visited the site", count: visitors.size },
        { key: "auth", label: "Opened sign in / sign up", count: authVisitors.size },
        { key: "signup", label: "Created an account", count: users.length },
        { key: "profile", label: "Completed their profile", count: profileComplete },
        { key: "action", label: "Took a first action", count: firstAction },
      ],
      byRole: [...byRole.entries()]
        .map(([role, s]) => ({ role, ...s }))
        .sort((a, b) => b.signups - a.signups),
    };
  },
});
