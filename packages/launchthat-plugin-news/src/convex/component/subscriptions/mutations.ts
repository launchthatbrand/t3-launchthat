import { v } from "convex/values";
import { mutation } from "../server";

export const upsertSubscription = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    symbol: v.string(),
    enabled: v.boolean(),
    minImpact: v.optional(v.string()),
    channels: v.optional(v.any()),
    cooldownSeconds: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    const orgId = args.orgId.trim();
    const symbol = args.symbol.trim().toUpperCase();
    if (!userId || !orgId || !symbol) throw new Error("Missing userId/orgId/symbol");
    const now = Date.now();

    const existing = await ctx.db
      .query("newsUserSubscriptions")
      .withIndex("by_user_org_symbol", (q) =>
        q.eq("userId", userId).eq("orgId", orgId).eq("symbol", symbol),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: Boolean(args.enabled),
        minImpact: typeof args.minImpact === "string" ? args.minImpact : undefined,
        channels: args.channels,
        cooldownSeconds:
          typeof args.cooldownSeconds === "number" && Number.isFinite(args.cooldownSeconds)
            ? Math.max(0, Math.floor(args.cooldownSeconds))
            : undefined,
        updatedAt: now,
      });
      return { ok: true };
    }

    await ctx.db.insert("newsUserSubscriptions", {
      userId,
      orgId,
      symbol,
      enabled: Boolean(args.enabled),
      minImpact: typeof args.minImpact === "string" ? args.minImpact : undefined,
      channels: args.channels,
      cooldownSeconds:
        typeof args.cooldownSeconds === "number" && Number.isFinite(args.cooldownSeconds)
          ? Math.max(0, Math.floor(args.cooldownSeconds))
          : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

