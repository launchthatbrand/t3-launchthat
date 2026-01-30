import { v } from "convex/values";
import { query } from "../_generated/server";

const normalizeCode = (raw: string) => raw.trim().toLowerCase();

export const getTopLandingPathsForUser = query({
  args: {
    userId: v.string(),
    daysBack: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    userId: v.string(),
    referralCode: v.union(v.string(), v.null()),
    daysBack: v.number(),
    totalClicks: v.number(),
    topLandingPaths: v.array(v.object({ path: v.string(), clicks: v.number() })),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));
    const limitRaw = typeof args.limit === "number" ? args.limit : 5;
    const limit = Math.max(1, Math.min(25, Math.floor(limitRaw)));
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const profile = await ctx.db
      .query("affiliateProfiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    const referralCode = profile ? normalizeCode(String((profile as any).referralCode ?? "")) : "";
    if (!referralCode) {
      return { userId, referralCode: null, daysBack, totalClicks: 0, topLandingPaths: [] };
    }

    const rows = await ctx.db
      .query("affiliateClicks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_referralCode_and_clickedAt", (q: any) => q.eq("referralCode", referralCode))
      .order("desc")
      .take(5000);

    const counts = new Map<string, number>();
    let totalClicks = 0;
    for (const row of rows as any[]) {
      const clickedAt = typeof row?.clickedAt === "number" ? Number(row.clickedAt) : 0;
      if (!clickedAt || clickedAt < since) break;
      totalClicks++;
      const landingPath = typeof row?.landingPath === "string" ? String(row.landingPath).trim() : "";
      const key = landingPath || "/";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topLandingPaths = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path, clicks]) => ({ path, clicks }));

    return { userId, referralCode, daysBack, totalClicks, topLandingPaths };
  },
});

