import { v } from "convex/values";

import { mutation } from "../server";

export const upsertTradeIdeaGroup = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
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
  },
  returns: v.id("tradeIdeaGroups"),
  handler: async (ctx, args) => {
    // MVP: one active group per (org,user, symbol) by convention. We use latest open group if present.
    const existingOpen = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_symbol_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("symbol", args.symbol),
      )
      .order("desc")
      .first();

    const now = Date.now();
    if (existingOpen && existingOpen.status === "open") {
      await ctx.db.patch(existingOpen._id, {
        connectionId: args.connectionId,
        accountId: args.accountId,
        status: args.status,
        direction: args.direction,
        openedAt: args.openedAt,
        closedAt: args.closedAt,
        netQty: args.netQty,
        avgEntryPrice: args.avgEntryPrice,
        realizedPnl: args.realizedPnl,
        fees: args.fees,
        lastExecutionAt: args.lastExecutionAt,
        lastProcessedExecutionId: args.lastProcessedExecutionId,
        updatedAt: now,
      });
      return existingOpen._id;
    }

    return await ctx.db.insert("tradeIdeaGroups", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      accountId: args.accountId,
      symbol: args.symbol,
      status: args.status,
      direction: args.direction,
      openedAt: args.openedAt,
      closedAt: args.closedAt,
      netQty: args.netQty,
      avgEntryPrice: args.avgEntryPrice,
      realizedPnl: args.realizedPnl,
      fees: args.fees,
      lastExecutionAt: args.lastExecutionAt,
      lastProcessedExecutionId: args.lastProcessedExecutionId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setDiscordMessageLink = mutation({
  args: {
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    discordChannelKind: v.union(v.literal("mentors"), v.literal("members")),
    discordChannelId: v.string(),
    discordMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tradeIdeaGroupId, {
      discordChannelKind: args.discordChannelKind,
      discordChannelId: args.discordChannelId,
      discordMessageId: args.discordMessageId,
      discordLastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markDiscordSynced = mutation({
  args: {
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tradeIdeaGroupId, {
      discordLastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});
