import { v } from "convex/values";
import { mutation, query } from "./server";

/**
 * DEPRECATED: replaced by `permissions` module.
 * Kept as a thin compatibility layer to avoid breaking older call sites.
 */
const defaultSettings = () => ({
  // Default to "global off" so users can control per-type, but keep all types enabled initially.
  globalEnabled: false,
  tradeIdeasEnabled: true,
  ordersEnabled: true,
  positionsEnabled: true,
  profileEnabled: true,
});

export const getMyShareVisibilitySettings = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.object({
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    positionsEnabled: v.boolean(),
    profileEnabled: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const defaults = defaultSettings();
    const row = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q
          .eq("userId", args.userId)
          .eq("scopeType", "org")
          .eq("scopeId", args.organizationId.trim()),
      )
      .unique();

    return {
      globalEnabled:
        typeof row?.globalEnabled === "boolean" ? row.globalEnabled : defaults.globalEnabled,
      tradeIdeasEnabled:
        typeof row?.tradeIdeasEnabled === "boolean"
          ? row.tradeIdeasEnabled
          : defaults.tradeIdeasEnabled,
      ordersEnabled:
        typeof row?.ordersEnabled === "boolean" ? row.ordersEnabled : defaults.ordersEnabled,
      positionsEnabled:
        typeof row?.openPositionsEnabled === "boolean"
          ? row.openPositionsEnabled
          : defaults.positionsEnabled,
      profileEnabled: defaults.profileEnabled,
    };
  },
});

export const upsertMyShareVisibilitySettings = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    positionsEnabled: v.boolean(),
    profileEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const organizationId = args.organizationId.trim();
    if (!organizationId) return null;

    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", "org").eq("scopeId", organizationId),
      )
      .unique();

    const next = {
      globalEnabled: Boolean(args.globalEnabled),
      tradeIdeasEnabled: Boolean(args.tradeIdeasEnabled),
      openPositionsEnabled: Boolean(args.positionsEnabled),
      ordersEnabled: Boolean(args.ordersEnabled),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return null;
    }

    await ctx.db.insert("permissions", {
      userId: args.userId,
      scopeType: "org",
      scopeId: organizationId,
      ...next,
    });
    return null;
  },
});

