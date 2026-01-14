import { v } from "convex/values";

import { mutation } from "../server";

export const upsertTradeOrder = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalOrderId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradeOrders"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeOrders")
      .withIndex("by_org_user_externalOrderId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalOrderId", args.externalOrderId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        symbol: args.symbol,
        instrumentId: args.instrumentId,
        side: args.side,
        status: args.status,
        createdAt: args.createdAt,
        closedAt: args.closedAt,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradeOrders", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      externalOrderId: args.externalOrderId,
      symbol: args.symbol,
      instrumentId: args.instrumentId,
      side: args.side,
      status: args.status,
      createdAt: args.createdAt,
      closedAt: args.closedAt,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});

export const upsertTradeExecution = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalExecutionId: v.string(),
    externalOrderId: v.optional(v.string()),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    executedAt: v.number(),
    price: v.optional(v.number()),
    qty: v.optional(v.number()),
    fees: v.optional(v.number()),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradeExecutions"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_externalExecutionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalExecutionId", args.externalExecutionId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        externalOrderId: args.externalOrderId,
        symbol: args.symbol,
        instrumentId: args.instrumentId,
        side: args.side,
        executedAt: args.executedAt,
        price: args.price,
        qty: args.qty,
        fees: args.fees,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradeExecutions", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      externalExecutionId: args.externalExecutionId,
      externalOrderId: args.externalOrderId,
      symbol: args.symbol,
      instrumentId: args.instrumentId,
      side: args.side,
      executedAt: args.executedAt,
      price: args.price,
      qty: args.qty,
      fees: args.fees,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});

export const upsertTradeOrderHistory = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalOrderId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradeOrdersHistory"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeOrdersHistory")
      .withIndex("by_org_user_externalOrderId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalOrderId", args.externalOrderId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        symbol: args.symbol,
        instrumentId: args.instrumentId,
        side: args.side,
        status: args.status,
        createdAt: args.createdAt,
        closedAt: args.closedAt,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradeOrdersHistory", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      externalOrderId: args.externalOrderId,
      symbol: args.symbol,
      instrumentId: args.instrumentId,
      side: args.side,
      status: args.status,
      createdAt: args.createdAt,
      closedAt: args.closedAt,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});

export const upsertTradePosition = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalPositionId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    openedAt: v.optional(v.number()),
    qty: v.optional(v.number()),
    avgPrice: v.optional(v.number()),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradePositions"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradePositions")
      .withIndex("by_org_user_externalPositionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalPositionId", args.externalPositionId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        symbol: args.symbol,
        instrumentId: args.instrumentId,
        side: args.side,
        openedAt: args.openedAt,
        qty: args.qty,
        avgPrice: args.avgPrice,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradePositions", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      externalPositionId: args.externalPositionId,
      symbol: args.symbol,
      instrumentId: args.instrumentId,
      side: args.side,
      openedAt: args.openedAt,
      qty: args.qty,
      avgPrice: args.avgPrice,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});

export const upsertTradeAccountState = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradeAccountStates"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeAccountStates")
      .withIndex("by_org_user_accountId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", args.accountId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradeAccountStates", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      accountId: args.accountId,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});
