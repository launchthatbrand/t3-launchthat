import { v } from "convex/values";
import { query } from "../server";

export const getOpenGroupForSymbol = query({
  args: {
    // Deprecated: trade data is user-owned; kept for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
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
      tradeIdeaId: v.optional(v.id("tradeIdeas")),
      ideaAssignedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const symbol = String(args.symbol ?? "").trim().toUpperCase();
    if (!symbol) return null;

    const latest = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_symbol_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("symbol", symbol).eq("status", "open"),
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
    // Deprecated: trade data is user-owned; kept for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
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
      tradeIdeaId: v.optional(v.id("tradeIdeas")),
      ideaAssignedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const symbol = String(args.symbol ?? "").trim().toUpperCase();
    if (!symbol) return null;

    const latestOpen = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_symbol_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("symbol", symbol).eq("status", "open"),
      )
      .order("desc")
      .first();

    const latestClosed = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_symbol_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("symbol", symbol).eq("status", "closed"),
      )
      .order("desc")
      .first();

    const openAt = typeof (latestOpen as any)?.openedAt === "number" ? Number((latestOpen as any).openedAt) : 0;
    const closedAt = typeof (latestClosed as any)?.openedAt === "number" ? Number((latestClosed as any).openedAt) : 0;
    if (openAt >= closedAt) return (latestOpen as any) ?? null;
    return (latestClosed as any) ?? null;
  },
});

export const hasAnyOpenGroup = query({
  args: {
    // Deprecated: trade data is user-owned; kept for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const any = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", "open"),
      )
      .order("desc")
      .first();
    return !!any;
  },
});

export const getGroupIdByPositionId = query({
  args: {
    // Deprecated: trade data is user-owned; kept for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    accountId: v.string(),
    positionId: v.string(),
  },
  returns: v.union(v.id("tradeIdeaGroups"), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_accountId_positionId", (q: any) =>
        q.eq("userId", args.userId).eq("accountId", args.accountId).eq("positionId", args.positionId),
      )
      .unique();
    return doc ? doc._id : null;
  },
});


