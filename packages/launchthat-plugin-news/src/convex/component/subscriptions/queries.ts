import { v } from "convex/values";
import { query } from "../server";

export const getSubscriptionForUserOrgSymbol = query({
  args: {
    userId: v.string(),
    orgId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("newsUserSubscriptions"),
      enabled: v.boolean(),
      minImpact: v.optional(v.string()),
      channels: v.optional(v.any()),
      cooldownSeconds: v.optional(v.number()),
      lastSentAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    const orgId = args.orgId.trim();
    const symbol = args.symbol.trim().toUpperCase();
    if (!userId || !orgId || !symbol) return null;
    const row = await ctx.db
      .query("newsUserSubscriptions")
      .withIndex("by_user_org_symbol", (q) =>
        q.eq("userId", userId).eq("orgId", orgId).eq("symbol", symbol),
      )
      .first();
    return row ? row : null;
  },
});

export const listEnabledSubscriptionsForSymbol = query({
  args: { symbol: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      orgId: v.string(),
      symbol: v.string(),
      enabled: v.boolean(),
      minImpact: v.optional(v.string()),
      channels: v.optional(v.any()),
      cooldownSeconds: v.optional(v.number()),
      lastSentAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim().toUpperCase();
    if (!symbol) return [];
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));
    const rows = await ctx.db
      .query("newsUserSubscriptions")
      .withIndex("by_symbol_enabled", (q) => (q as any).eq("symbol", symbol).eq("enabled", true))
      .take(limit);
    return Array.isArray(rows) ? rows : [];
  },
});

