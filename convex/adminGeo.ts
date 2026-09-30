import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/admin";
import { KENYA_COUNTIES } from "./lib/kenya";

/**
 * Where people and ventures are, from the county / country they entered themselves.
 * Nothing is inferred or estimated: "unknown" is everyone who has not set a location.
 */
export const distribution = query({
  args: { kind: v.union(v.literal("applicants"), v.literal("ventures"), v.literal("employers")) },
  handler: async (ctx, { kind }) => {
    await requireAdmin(ctx);
    let items: { county?: string; country?: string }[];
    if (kind === "ventures") {
      items = await ctx.db.query("ventures").take(10000);
    } else {
      const roles = kind === "employers" ? ["employer"] : ["talent", "founder"];
      const profiles = await ctx.db.query("profiles").take(10000);
      items = profiles.filter((p) => p.userType && roles.includes(p.userType));
    }

    const byCounty = new Map<string, number>(KENYA_COUNTIES.map((c) => [c, 0]));
    const outside = new Map<string, number>();
    let unknown = 0;
    for (const it of items) {
      if (it.county && byCounty.has(it.county)) byCounty.set(it.county, byCounty.get(it.county)! + 1);
      else if (it.country && it.country.trim() && it.country.trim().toLowerCase() !== "kenya") {
        const c = it.country.trim();
        outside.set(c, (outside.get(c) ?? 0) + 1);
      } else unknown++;
    }
    const inKenya = [...byCounty.values()].reduce((a, b) => a + b, 0);
    return {
      total: items.length,
      inKenya,
      outsideKenya: [...outside.values()].reduce((a, b) => a + b, 0),
      unknown,
      counties: [...byCounty.entries()].map(([county, count]) => ({ county, count })),
      countries: [...outside.entries()].map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
    };
  },
});
