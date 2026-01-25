import { v } from "convex/values";
import { mutation, query } from "./server";

/**
 * DEPRECATED: replaced by `permissions` module.
 * Kept as a thin compatibility layer to avoid breaking older call sites.
 */
const defaults = () => ({
  globalPublic: false,
  tradeIdeasPublic: false,
  ordersPublic: false,
  positionsPublic: false,
  profilePublic: false,
  analyticsReportsPublic: false,
});

export const getMyVisibilitySettings = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.object({
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const d = defaults();
    const row = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", "global").eq("scopeId", null),
      )
      .unique();

    return {
      globalPublic: typeof row?.globalEnabled === "boolean" ? row.globalEnabled : d.globalPublic,
      tradeIdeasPublic:
        typeof row?.tradeIdeasEnabled === "boolean"
          ? row.tradeIdeasEnabled
          : d.tradeIdeasPublic,
      ordersPublic:
        typeof row?.ordersEnabled === "boolean" ? row.ordersEnabled : d.ordersPublic,
      positionsPublic:
        typeof row?.openPositionsEnabled === "boolean"
          ? row.openPositionsEnabled
          : d.positionsPublic,
      profilePublic: d.profilePublic,
      analyticsReportsPublic: d.analyticsReportsPublic,
    };
  },
});

export const upsertMyVisibilitySettings = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", "global").eq("scopeId", null),
      )
      .unique();

    const next = {
      globalEnabled: Boolean(args.globalPublic),
      tradeIdeasEnabled: Boolean(args.tradeIdeasPublic),
      openPositionsEnabled: Boolean(args.positionsPublic),
      ordersEnabled: Boolean(args.ordersPublic),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return null;
    }

    await ctx.db.insert("permissions", {
      userId: args.userId,
      scopeType: "global",
      scopeId: null,
      ...next,
    });

    return null;
  },
});

