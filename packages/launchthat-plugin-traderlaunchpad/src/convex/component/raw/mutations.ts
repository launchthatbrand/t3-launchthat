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
    externalPositionId: v.optional(v.string()),
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
        externalPositionId: args.externalPositionId,
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
      externalPositionId: args.externalPositionId,
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

export const backfillSymbolsForUser = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    instrumentSymbols: v.array(
      v.object({
        instrumentId: v.string(),
        symbol: v.string(),
      }),
    ),
    perInstrumentCap: v.optional(v.number()),
  },
  returns: v.object({
    instrumentsReceived: v.number(),
    executionsPatched: v.number(),
    tradeIdeaGroupsPatched: v.number(),
  }),
  handler: async (ctx, args) => {
    const perInstrumentCap = Math.max(1, Math.min(2000, args.perInstrumentCap ?? 500));

    const map = new Map<string, string>();
    for (const row of args.instrumentSymbols) {
      const instrumentId = row.instrumentId.trim();
      const symbol = row.symbol.trim().toUpperCase();
      if (!instrumentId || !symbol) continue;
      map.set(instrumentId, symbol);
    }

    let executionsPatched = 0;
    let tradeIdeaGroupsPatched = 0;

    for (const [instrumentId, symbol] of map) {
      // Patch executions missing a symbol.
      const execs = await ctx.db
        .query("tradeExecutions")
        .withIndex("by_org_user_instrumentId_executedAt", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("userId", args.userId)
            .eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);

      for (const e of execs) {
        const existing =
          typeof (e as any).symbol === "string" ? String((e as any).symbol).trim() : "";
        if (existing) continue;
        await ctx.db.patch(e._id, { symbol });
        executionsPatched += 1;
      }

      // Patch trade idea groups that were created with UNKNOWN/missing symbol.
      const groups = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_org_user_instrumentId_openedAt", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("userId", args.userId)
            .eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);

      for (const g of groups) {
        const existing =
          typeof (g as any).symbol === "string" ? String((g as any).symbol).trim() : "";
        const existingUpper = existing.toUpperCase();
        const isUnknown = !existingUpper || existingUpper === "UNKNOWN";
        const isJustInstrumentId = existing === instrumentId;
        const isNumericOnly = /^\d+$/.test(existing);
        if (!isUnknown && !isJustInstrumentId && !isNumericOnly) continue;
        await ctx.db.patch(g._id, { symbol });
        tradeIdeaGroupsPatched += 1;
      }
    }

    return {
      instrumentsReceived: map.size,
      executionsPatched,
      tradeIdeaGroupsPatched,
    };
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
    unrealizedPnl: v.optional(v.number()),
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
        unrealizedPnl: args.unrealizedPnl,
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
      unrealizedPnl: args.unrealizedPnl,
      raw: args.raw,
      updatedAt: now,
    });
    return { id, wasNew: true };
  },
});

export const upsertTradeRealizationEvent = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    externalEventId: v.string(),
    externalOrderId: v.optional(v.string()),
    externalPositionId: v.string(),
    tradeIdeaGroupId: v.optional(v.id("tradeIdeaGroups")),
    openAtMs: v.optional(v.number()),
    openPrice: v.optional(v.number()),
    closePrice: v.optional(v.number()),
    commission: v.optional(v.number()),
    swap: v.optional(v.number()),
    openOrderId: v.optional(v.string()),
    openTradeId: v.optional(v.string()),
    closeTradeId: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    tradableInstrumentId: v.optional(v.string()),
    positionSide: v.optional(v.string()),
    orderType: v.optional(v.string()),
    closedAt: v.number(),
    realizedPnl: v.number(),
    fees: v.optional(v.number()),
    qtyClosed: v.optional(v.number()),
    raw: v.any(),
  },
  returns: v.object({
    id: v.id("tradeRealizationEvents"),
    wasNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeRealizationEvents")
      .withIndex("by_org_user_externalEventId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalEventId", args.externalEventId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        accountId: args.accountId,
        externalOrderId: args.externalOrderId,
        externalPositionId: args.externalPositionId,
        tradeIdeaGroupId: args.tradeIdeaGroupId,
        openAtMs: args.openAtMs,
        openPrice: args.openPrice,
        closePrice: args.closePrice,
        commission: args.commission,
        swap: args.swap,
        openOrderId: args.openOrderId,
        openTradeId: args.openTradeId,
        closeTradeId: args.closeTradeId,
        instrumentId: args.instrumentId,
        tradableInstrumentId: args.tradableInstrumentId,
        positionSide: args.positionSide,
        orderType: args.orderType,
        closedAt: args.closedAt,
        realizedPnl: args.realizedPnl,
        fees: args.fees,
        qtyClosed: args.qtyClosed,
        raw: args.raw,
        updatedAt: now,
      });
      return { id: existing._id, wasNew: false };
    }

    const id = await ctx.db.insert("tradeRealizationEvents", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      accountId: args.accountId,
      externalEventId: args.externalEventId,
      externalOrderId: args.externalOrderId,
      externalPositionId: args.externalPositionId,
      tradeIdeaGroupId: args.tradeIdeaGroupId,
      openAtMs: args.openAtMs,
      openPrice: args.openPrice,
      closePrice: args.closePrice,
      commission: args.commission,
      swap: args.swap,
      openOrderId: args.openOrderId,
      openTradeId: args.openTradeId,
      closeTradeId: args.closeTradeId,
      instrumentId: args.instrumentId,
      tradableInstrumentId: args.tradableInstrumentId,
      positionSide: args.positionSide,
      orderType: args.orderType,
      closedAt: args.closedAt,
      realizedPnl: args.realizedPnl,
      fees: args.fees,
      qtyClosed: args.qtyClosed,
      raw: args.raw,
      createdAt: now,
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
