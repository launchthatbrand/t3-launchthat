import { v } from "convex/values";
import { query } from "../server";

export const getOpenGroupForSymbol = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      symbol: v.string(),
      status: v.union(v.literal("open"), v.literal("closed")),
      direction: v.union(v.literal("long"), v.literal("short")),
      openedAt: v.number(),
      closedAt: v.optional(v.number()),
      netQty: v.number(),
      avgEntryPrice: v.optional(v.number()),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      lastExecutionAt: v.optional(v.number()),
      lastProcessedExecutionId: v.optional(v.string()),
      discordChannelKind: v.optional(
        v.union(v.literal("mentors"), v.literal("members")),
      ),
      discordChannelId: v.optional(v.string()),
      discordMessageId: v.optional(v.string()),
      discordLastSyncedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_symbol_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("symbol", args.symbol),
      )
      .order("desc")
      .first();

    if (!latest) return null;
    if (latest.status !== "open") return null;
    return latest;
  },
});

export const getLatestGroupForSymbol = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      symbol: v.string(),
      status: v.union(v.literal("open"), v.literal("closed")),
      direction: v.union(v.literal("long"), v.literal("short")),
      openedAt: v.number(),
      closedAt: v.optional(v.number()),
      netQty: v.number(),
      avgEntryPrice: v.optional(v.number()),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      lastExecutionAt: v.optional(v.number()),
      lastProcessedExecutionId: v.optional(v.string()),
      discordChannelKind: v.optional(
        v.union(v.literal("mentors"), v.literal("members")),
      ),
      discordChannelId: v.optional(v.string()),
      discordMessageId: v.optional(v.string()),
      discordLastSyncedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_symbol_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("symbol", args.symbol),
      )
      .order("desc")
      .first();

    return latest ?? null;
  },
});

export const hasAnyOpenGroup = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const any = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId).eq("status", "open"),
      )
      .order("desc")
      .first();
    return !!any;
  },
});


