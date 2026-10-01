import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getActiveUserId as getAuthUserId } from "./lib/auth";
import { requireAdmin, logAdminAction } from "./lib/admin";
import { getEmployerPlan } from "./lib/plans";

const limitsValidator = v.object({
  activeJobs: v.optional(v.number()),
  activeChallenges: v.optional(v.number()),
  shortlistSize: v.optional(v.number()),
  seats: v.optional(v.number()),
});

/** Plans as seen by any signed-in employer (read-only, no internals). */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("plans").collect();
    return plans
      .filter((p) => p.isActive)
      .sort((a, b) => a.order - b.order)
      .map((p) => ({ slug: p.slug, name: p.name, priceDisplay: p.priceDisplay, description: p.description ?? null, limits: p.limits, features: p.features, offer: p.offer && (!p.offer.endsAt || p.offer.endsAt > Date.now()) ? p.offer : null }));
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const plans = await ctx.db.query("plans").collect();
    return plans.sort((a, b) => a.order - b.order).map((p) => ({ id: p._id, ...p }));
  },
});

export const upsert = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    priceDisplay: v.string(),
    description: v.optional(v.string()),
    limits: limitsValidator,
    features: v.array(v.string()),
    offer: v.optional(v.object({ label: v.string(), priceDisplay: v.optional(v.string()), endsAt: v.optional(v.number()) })),
    isActive: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const slug = args.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(slug)) throw new Error("Slug must be 2-30 lowercase letters, numbers or dashes");
    if (!args.name.trim()) throw new Error("Plan name is required");
    for (const [k, val] of Object.entries(args.limits)) {
      if (val !== undefined && (!Number.isFinite(val) || val < 0)) throw new Error(`Limit "${k}" must be 0 or more`);
    }
    const data = {
      ...args,
      slug,
      name: args.name.trim().slice(0, 60),
      priceDisplay: args.priceDisplay.trim().slice(0, 60),
      features: args.features.map((f) => f.trim()).filter(Boolean).slice(0, 20),
    };
    const existing = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    // patch() leaves an omitted offer untouched, so clearing it must be explicit.
    if (existing) await ctx.db.patch(existing._id, { ...data, offer: args.offer ?? undefined });
    else await ctx.db.insert("plans", data);
    await logAdminAction(ctx, adminId, existing ? "plan_updated" : "plan_created", { detail: slug });
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const adminId = await requireAdmin(ctx);
    const plan = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (!plan) throw new Error("Plan not found");
    const employers = await ctx.db.query("employerProfiles").take(5000);
    const using = employers.filter((e) => (e.planSlug ?? "free") === slug).length;
    if (using > 0) throw new Error(`${using} employer(s) are on this plan. Move them to another plan first.`);
    await ctx.db.delete(plan._id);
    await logAdminAction(ctx, adminId, "plan_deleted", { detail: slug });
  },
});

/** Employers with their plan and live usage against the plan limits (for the gauges). */
export const employerUsage = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").take(5000);
    const employers = profiles.filter((p) => p.userType === "employer");
    return await Promise.all(
      employers.map(async (p) => {
        const [jobs, challenges, shortlist, { slug, plan }, user] = await Promise.all([
          ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", p.userId)).collect(),
          ctx.db.query("challenges").withIndex("by_employerId", (q) => q.eq("employerId", p.userId)).collect(),
          ctx.db.query("shortlists").withIndex("by_recruiterId", (q) => q.eq("recruiterId", p.userId)).collect(),
          getEmployerPlan(ctx, p.userId),
          (async () => {
            const uid = ctx.db.normalizeId("users", p.userId);
            return uid ? await ctx.db.get(uid) : null;
          })(),
        ]);
        return {
          userId: p.userId,
          name: p.companyName || p.fullName || p.username || user?.email || "Employer",
          email: user?.email ?? null,
          planSlug: slug,
          planName: plan?.name ?? null,
          usage: {
            activeJobs: jobs.filter((j) => j.isActive).length,
            activeChallenges: challenges.filter((c) => c.isActive).length,
            shortlistSize: shortlist.length,
          },
          limits: plan?.limits ?? null,
        };
      })
    );
  },
});

export const setEmployerPlan = mutation({
  args: { userId: v.string(), planSlug: v.string() },
  handler: async (ctx, { userId, planSlug }) => {
    const adminId = await requireAdmin(ctx);
    const plan = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", planSlug)).first();
    if (!plan) throw new Error("Unknown plan");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile?.userType !== "employer") throw new Error("Only employer accounts can be assigned a plan");
    const emp = await ctx.db.query("employerProfiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    const before = emp?.planSlug ?? "free";
    if (emp) await ctx.db.patch(emp._id, { planSlug });
    else await ctx.db.insert("employerProfiles", { userId, planSlug });
    await logAdminAction(ctx, adminId, "employer_plan_changed", { detail: `${userId}: ${before} -> ${planSlug}` });
  },
});

/**
 * Create the three tiers published on donjoafrica.com (Starter, Venture, Enterprise). Starter uses
 * the slug "free" because every employer begins on it. Limits are deliberately left unset
 * (unlimited) because the public site publishes none; an admin sets them per plan afterwards.
 * Existing plans are never overwritten.
 */
export const seedStandardPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const adminId = await requireAdmin(ctx);
    const standard = [
      {
        slug: "free", name: "Starter", priceDisplay: "Free", order: 1,
        description: "For small teams trying proof-based hiring.",
        features: ["Post jobs with a video question", "Watch applicants' video portfolios", "Shortlist or reject, with private notes", "Skill tags and a skill match on every applicant", "Applicant dossier, reviewer ratings and radar", "PDF and CSV export of applicants"],
      },
      {
        slug: "venture", name: "Venture", priceDisplay: "$99 / month", order: 2,
        description: "For startups and accelerators with a growing pipeline.",
        features: ["Everything in Starter", "Higher limits on active jobs, challenges and shortlist size", "Plan set up and invoiced directly by our team"],
      },
      {
        slug: "enterprise", name: "Enterprise", priceDisplay: "Custom", order: 3,
        description: "For large cohorts, universities and venture studios.",
        features: ["Everything in Venture", "Limits and terms agreed with you in writing"],
      },
    ];
    let created = 0;
    for (const p of standard) {
      const existing = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", p.slug)).first();
      if (existing) continue;
      await ctx.db.insert("plans", { ...p, limits: {}, isActive: true });
      created++;
    }
    await logAdminAction(ctx, adminId, "plans_seeded", { detail: `${created} created` });
    return created;
  },
});

/* ------------------------------------------------------------------ employer plan selection */

/** The signed-in employer's plan, live usage against it, and any pending change request. */
export const myPlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const [{ slug, plan }, jobs, challenges, shortlist, pending] = await Promise.all([
      getEmployerPlan(ctx, userId),
      ctx.db.query("jobPostings").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
      ctx.db.query("challenges").withIndex("by_employerId", (q) => q.eq("employerId", userId)).collect(),
      ctx.db.query("shortlists").withIndex("by_recruiterId", (q) => q.eq("recruiterId", userId)).collect(),
      ctx.db.query("planRequests").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(5),
    ]);
    return {
      slug,
      limits: plan?.limits ?? null,
      usage: {
        activeJobs: jobs.filter((j) => j.isActive).length,
        activeChallenges: challenges.filter((c) => c.isActive).length,
        shortlistSize: shortlist.length,
      },
      pendingRequest: pending.find((r) => r.status === "pending")?.planSlug ?? null,
    };
  },
});

/** An employer asks to move to another tier. Plans are set up and invoiced by the Donjo team, so this queues a request. */
export const requestPlan = mutation({
  args: { planSlug: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, { planSlug, note }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
    if (profile?.userType !== "employer") throw new ConvexError("Only employer accounts can choose a plan.");
    const plan = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", planSlug)).first();
    if (!plan || !plan.isActive) throw new ConvexError("That plan is not available.");
    const { slug: current } = await getEmployerPlan(ctx, userId);
    if (current === planSlug) throw new ConvexError("You are already on this plan.");
    const open = await ctx.db.query("planRequests").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    const pending = open.find((r) => r.status === "pending");
    if (pending) {
      if (pending.planSlug === planSlug) throw new ConvexError("You already have a pending request for this plan.");
      await ctx.db.patch(pending._id, { planSlug, note: note?.trim().slice(0, 500) });
      return;
    }
    await ctx.db.insert("planRequests", { userId, planSlug, note: note?.trim().slice(0, 500), status: "pending", createdAt: Date.now() });
  },
});

export const cancelPlanRequest = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in again.");
    const rows = await ctx.db.query("planRequests").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    for (const r of rows) if (r.status === "pending") await ctx.db.patch(r._id, { status: "cancelled" });
  },
});

/** Admin: open plan requests with who asked. */
export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("planRequests").withIndex("by_status", (q) => q.eq("status", "pending")).order("desc").take(100);
    return await Promise.all(
      rows.map(async (r) => {
        const uid = ctx.db.normalizeId("users", r.userId);
        const user = uid ? await ctx.db.get(uid) : null;
        const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", r.userId)).first();
        return { id: r._id, userId: r.userId, planSlug: r.planSlug, note: r.note ?? null, createdAt: r.createdAt, name: profile?.companyName || profile?.username || user?.email || "Employer", email: user?.email ?? null };
      })
    );
  },
});

/** Admin: approve (moves the employer to the plan) or decline a request. */
export const resolveRequest = mutation({
  args: { requestId: v.id("planRequests"), approve: v.boolean() },
  handler: async (ctx, { requestId, approve }) => {
    const adminId = await requireAdmin(ctx);
    const req = await ctx.db.get(requestId);
    if (!req || req.status !== "pending") throw new Error("That request was already handled");
    if (approve) {
      const plan = await ctx.db.query("plans").withIndex("by_slug", (q) => q.eq("slug", req.planSlug)).first();
      if (!plan) throw new Error("That plan no longer exists");
      const emp = await ctx.db.query("employerProfiles").withIndex("by_userId", (q) => q.eq("userId", req.userId)).first();
      if (emp) await ctx.db.patch(emp._id, { planSlug: req.planSlug });
      else await ctx.db.insert("employerProfiles", { userId: req.userId, planSlug: req.planSlug });
    }
    await ctx.db.patch(requestId, { status: approve ? "approved" : "declined", handledAt: Date.now() });
    await logAdminAction(ctx, adminId, approve ? "plan_request_approved" : "plan_request_declined", { detail: `${req.userId}: ${req.planSlug}` });
  },
});
