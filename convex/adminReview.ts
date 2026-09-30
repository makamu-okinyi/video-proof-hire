import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, logAdminAction } from "./lib/admin";
import { applyVentureReview } from "./lib/review";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const ventures = await ctx.db.query("ventures").order("desc").take(1000);
    return await Promise.all(
      ventures.map(async (x) => {
        const founders = await ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", x._id)).collect();
        const lead = founders.find((f) => f.isLead) ?? founders[0];
        const leadProfile = lead
          ? await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", lead.userId)).first()
          : null;
        const submittedAt =
          [...(x.statusHistory ?? [])].reverse().find((h) => h.status === "submitted")?.at ?? x._creationTime;
        return {
          id: x._id,
          name: x.name,
          tagline: x.tagline,
          stage: x.stage,
          industry: x.industry ?? [],
          status: x.reviewStatus,
          county: x.county ?? null,
          country: x.country ?? null,
          founderName: leadProfile?.fullName || leadProfile?.username || null,
          hasVideo: !!x.pitchVideoUrl,
          submittedAt,
          reviewedAt: x.reviewedAt ?? null,
          score: x.reviewScore ?? null,
        };
      })
    );
  },
});

export const detail = query({
  args: { ventureId: v.id("ventures") },
  handler: async (ctx, { ventureId }) => {
    await requireAdmin(ctx);
    const x = await ctx.db.get(ventureId);
    if (!x) return null;
    const [founderRows, decks] = await Promise.all([
      ctx.db.query("ventureFounders").withIndex("by_ventureId", (q) => q.eq("ventureId", ventureId)).collect(),
      ctx.db.query("pitchDecks").withIndex("by_ventureId_isCurrent", (q) => q.eq("ventureId", ventureId).eq("isCurrentVersion", true)).collect(),
    ]);
    const founders = await Promise.all(
      founderRows.map(async (f) => {
        const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", f.userId)).first();
        const uid = ctx.db.normalizeId("users", f.userId);
        const u = uid ? await ctx.db.get(uid) : null;
        return { userId: f.userId, role: f.role, title: f.title ?? null, isLead: f.isLead, name: p?.fullName || p?.username || null, email: u?.email ?? null };
      })
    );
    const nameOf = async (id?: string) => {
      if (!id) return null;
      const p = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", id)).first();
      return p?.fullName || p?.username || null;
    };
    const history = await Promise.all(
      (x.statusHistory ?? [{ status: "submitted", at: x._creationTime }]).map(async (h) => ({
        status: h.status,
        at: h.at,
        reason: h.reason ?? null,
        by: (await nameOf(h.by)) ?? null,
      }))
    );
    return {
      id: x._id,
      name: x.name,
      tagline: x.tagline,
      description: x.description ?? null,
      problemStatement: x.problemStatement ?? null,
      solution: x.solution ?? null,
      traction: x.traction ?? null,
      businessModel: x.businessModel ?? null,
      marketSize: x.marketSize ?? null,
      stage: x.stage,
      industry: x.industry ?? [],
      techStack: x.techStack ?? [],
      websiteUrl: x.websiteUrl ?? null,
      demoUrl: x.demoUrl ?? null,
      pitchVideoUrl: x.pitchVideoUrl ?? null,
      county: x.county ?? null,
      country: x.country ?? null,
      status: x.reviewStatus,
      reviewReason: x.reviewReason ?? null,
      reviewNotes: x.reviewNotes ?? "",
      reviewScore: x.reviewScore ?? null,
      reviewedAt: x.reviewedAt ?? null,
      reviewedBy: await nameOf(x.reviewedBy),
      createdAt: x._creationTime,
      founders,
      decks: decks.map((d) => ({ title: d.title, fileUrl: d.fileUrl, version: d.version })),
      history,
    };
  },
});

export const review = mutation({
  args: {
    ventureId: v.id("ventures"),
    status: v.union(v.literal("submitted"), v.literal("shortlisted"), v.literal("rejected")),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, { ventureId, status, reason, notes, score }) => {
    const adminId = await requireAdmin(ctx);
    await applyVentureReview(ctx, adminId, ventureId, status, { reason, notes, score });
  },
});

export const bulkReview = mutation({
  args: {
    ventureIds: v.array(v.id("ventures")),
    status: v.union(v.literal("submitted"), v.literal("shortlisted"), v.literal("rejected")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { ventureIds, status, reason }) => {
    const adminId = await requireAdmin(ctx);
    if (ventureIds.length === 0 || ventureIds.length > 50) throw new Error("Select between 1 and 50 ventures");
    for (const id of ventureIds) await applyVentureReview(ctx, adminId, id, status, { reason });
    await logAdminAction(ctx, adminId, "venture_bulk_review", { detail: `${ventureIds.length} ventures -> ${status}` });
    return ventureIds.length;
  },
});

export const saveNotes = mutation({
  args: { ventureId: v.id("ventures"), notes: v.string(), score: v.optional(v.number()) },
  handler: async (ctx, { ventureId, notes, score }) => {
    const adminId = await requireAdmin(ctx);
    if (score !== undefined && (score < 0 || score > 10)) throw new Error("Score must be between 0 and 10");
    const x = await ctx.db.get(ventureId);
    if (!x) throw new Error("Venture not found");
    await ctx.db.patch(ventureId, { reviewNotes: notes.trim().slice(0, 4000), ...(score !== undefined ? { reviewScore: score } : {}) });
    await logAdminAction(ctx, adminId, "venture_notes_saved", { detail: `${x.name} (${ventureId})` });
  },
});
