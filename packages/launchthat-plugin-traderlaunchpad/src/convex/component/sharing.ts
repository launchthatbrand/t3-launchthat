import { v } from "convex/values";
import { mutation, query } from "./server";

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
    const row = await ctx.db
      .query("shareVisibilitySettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const defaults = defaultSettings();
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
        typeof row?.positionsEnabled === "boolean"
          ? row.positionsEnabled
          : defaults.positionsEnabled,
      profileEnabled:
        typeof row?.profileEnabled === "boolean" ? row.profileEnabled : defaults.profileEnabled,
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
    const existing = await ctx.db
      .query("shareVisibilitySettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const next = {
      globalEnabled: Boolean(args.globalEnabled),
      tradeIdeasEnabled: Boolean(args.tradeIdeasEnabled),
      ordersEnabled: Boolean(args.ordersEnabled),
      positionsEnabled: Boolean(args.positionsEnabled),
      profileEnabled: Boolean(args.profileEnabled),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, next);
      return null;
    }

    await ctx.db.insert("shareVisibilitySettings", {
      organizationId: args.organizationId,
      userId: args.userId,
      ...next,
    });
    return null;
  },
});

