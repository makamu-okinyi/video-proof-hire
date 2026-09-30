import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/admin";

const CAP = 10000;

/** Filterable audit log. Filters are applied to the most recent entries (bounded). */
export const auditLog = query({
  args: {
    actor: v.optional(v.string()), // user id
    action: v.optional(v.string()),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { actor, action, from, to, limit }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("adminAuditLog").withIndex("by_at").order("desc").take(2000);
    const filtered = rows
      .filter((r) => (!actor || r.userId === actor) && (!action || r.action === action) && (!from || r.at >= from) && (!to || r.at <= to))
      .slice(0, Math.min(limit ?? 200, 500));
    const cache = new Map<string, string | null>();
    const nameOf = async (id: string) => {
      if (cache.has(id)) return cache.get(id)!;
      const uid = ctx.db.normalizeId("users", id);
      const u = uid ? await ctx.db.get(uid) : null;
      const label = u?.email ?? null;
      cache.set(id, label);
      return label;
    };
    const entries = await Promise.all(
      filtered.map(async (r) => ({ id: r._id, at: r.at, userId: r.userId, actor: await nameOf(r.userId), action: r.action, detail: r.detail ?? null, userAgent: r.userAgent ?? null }))
    );
    return {
      entries,
      actions: [...new Set(rows.map((r) => r.action))].sort(),
      actors: await Promise.all(
        [...new Set(rows.map((r) => r.userId))].map(async (id) => ({ id, label: (await nameOf(id)) ?? id }))
      ),
    };
  },
});

/** Admin accounts with last sign-in and passkey coverage. */
export const adminSecurity = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").take(5000);
    const admins = profiles.filter((p) => p.userType === "admin");
    const rows = await Promise.all(
      admins.map(async (p) => {
        const uid = ctx.db.normalizeId("users", p.userId);
        const user = uid ? await ctx.db.get(uid) : null;
        const [passkeys, logins, sessions] = await Promise.all([
          uid ? ctx.db.query("passkeys").withIndex("by_userId", (q) => q.eq("userId", uid)).collect() : Promise.resolve([]),
          ctx.db.query("adminAuditLog").withIndex("by_userId", (q) => q.eq("userId", p.userId)).order("desc").take(50),
          uid ? ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", uid)).collect() : Promise.resolve([]),
        ]);
        return {
          userId: p.userId,
          email: user?.email ?? null,
          passkeys: passkeys.length,
          lastSignIn: logins.find((l) => l.action === "sign_in")?.at ?? null,
          activeSessions: sessions.length,
        };
      })
    );
    return {
      admins: rows,
      withPasskey: rows.filter((r) => r.passkeys > 0).length,
      total: rows.length,
    };
  },
});

const TABLES = [
  "users", "profiles", "passkeys", "videos", "videoComments", "jobPostings", "jobApplications",
  "challenges", "challengeSubmissions", "ventures", "ventureFounders", "pitchDecks",
  "conversations", "messages", "notifications", "shortlists", "employerProfiles",
  "plans", "analyticsEvents", "adminAuditLog", "webauthnChallenges",
] as const;

/** Row counts per table (capped) and file storage totals. */
export const health = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const tables = await Promise.all(
      TABLES.map(async (t) => {
        const rows = await ctx.db.query(t).take(CAP + 1);
        return { table: t, count: Math.min(rows.length, CAP), capped: rows.length > CAP };
      })
    );
    const files = await ctx.db.system.query("_storage").take(CAP + 1);
    return {
      tables,
      storage: {
        files: Math.min(files.length, CAP),
        capped: files.length > CAP,
        bytes: files.slice(0, CAP).reduce((sum, f) => sum + f.size, 0),
      },
      generatedAt: Date.now(),
    };
  },
});
