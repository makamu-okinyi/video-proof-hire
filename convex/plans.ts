import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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
      .map((p) => ({ slug: p.slug, name: p.name, priceDisplay: p.priceDisplay, description: p.description ?? null, limits: p.limits, features: p.features }));
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
    if (existing) await ctx.db.patch(existing._id, data);
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
