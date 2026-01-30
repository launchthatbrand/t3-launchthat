import { v } from "convex/values";

import { mutation } from "../server";

export const upsertTradeOrder = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
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
      .withIndex("by_user_externalOrderId", (q: any) =>
        q.eq("userId", args.userId).eq("externalOrderId", args.externalOrderId),
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
    connectionId: v.id("brokerConnections"),
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
      .withIndex("by_user_externalExecutionId", (q: any) =>
        q.eq("userId", args.userId).eq("externalExecutionId", args.externalExecutionId),
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
    ordersPatched: v.number(),
    ordersHistoryPatched: v.number(),
    positionsPatched: v.number(),
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
    let ordersPatched = 0;
    let ordersHistoryPatched = 0;
    let positionsPatched = 0;
    let tradeIdeaGroupsPatched = 0;

    const shouldPatchSymbol = (existing: string, instrumentId: string): boolean => {
      const s = existing.trim();
      const upper = s.toUpperCase();
      const isUnknown = !upper || upper === "UNKNOWN";
      const isJustInstrumentId = s === instrumentId;
      const isNumericOnly = /^\d+$/.test(s);
      return isUnknown || isJustInstrumentId || isNumericOnly;
    };

    for (const [instrumentId, symbol] of map) {
      // Patch executions missing a symbol.
      const execs = await ctx.db
        .query("tradeExecutions")
        .withIndex("by_user_instrumentId_executedAt", (q: any) =>
          q.eq("userId", args.userId).eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);

      for (const e of execs) {
        const existing =
          typeof (e as any).symbol === "string" ? String((e as any).symbol).trim() : "";
        if (!shouldPatchSymbol(existing, instrumentId)) continue;
        await ctx.db.patch(e._id, { symbol });
        executionsPatched += 1;
      }

      // Patch orders / orders history symbol fields (often numeric IDs from table payloads).
      const orders = await ctx.db
        .query("tradeOrders")
        .withIndex("by_user_instrumentId_updatedAt", (q: any) =>
          q.eq("userId", args.userId).eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);
      for (const o of orders) {
        const existing =
          typeof (o as any).symbol === "string" ? String((o as any).symbol).trim() : "";
        if (!shouldPatchSymbol(existing, instrumentId)) continue;
        await ctx.db.patch(o._id, { symbol });
        ordersPatched += 1;
      }

      const ordersHistory = await ctx.db
        .query("tradeOrdersHistory")
        .withIndex("by_user_instrumentId_updatedAt", (q: any) =>
          q.eq("userId", args.userId).eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);
      for (const o of ordersHistory) {
        const existing =
          typeof (o as any).symbol === "string" ? String((o as any).symbol).trim() : "";
        if (!shouldPatchSymbol(existing, instrumentId)) continue;
        await ctx.db.patch(o._id, { symbol });
        ordersHistoryPatched += 1;
      }

      // Patch positions (no instrumentId index in all cases; scan recent positions and filter).
      const positions = await ctx.db
        .query("tradePositions")
        .withIndex("by_user_openedAt", (q: any) => q.eq("userId", args.userId))
        .order("desc")
        .take(perInstrumentCap);
      for (const p of positions) {
        const pInstrumentId =
          typeof (p as any).instrumentId === "string" ? String((p as any).instrumentId).trim() : "";
        if (pInstrumentId !== instrumentId) continue;
        const existing =
          typeof (p as any).symbol === "string" ? String((p as any).symbol).trim() : "";
        if (!shouldPatchSymbol(existing, instrumentId)) continue;
        await ctx.db.patch(p._id, { symbol });
        positionsPatched += 1;
      }

      // Patch trade idea groups that were created with UNKNOWN/missing symbol.
      const groups = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_user_instrumentId_openedAt", (q: any) =>
          q.eq("userId", args.userId).eq("instrumentId", instrumentId),
        )
        .order("desc")
        .take(perInstrumentCap);

      for (const g of groups) {
        const existing =
          typeof (g as any).symbol === "string" ? String((g as any).symbol).trim() : "";
        if (!shouldPatchSymbol(existing, instrumentId)) continue;
        await ctx.db.patch(g._id, { symbol });
        tradeIdeaGroupsPatched += 1;
      }
    }

    return {
      instrumentsReceived: map.size,
      executionsPatched,
      ordersPatched,
      ordersHistoryPatched,
      positionsPatched,
      tradeIdeaGroupsPatched,
    };
  },
});

export const upsertTradeOrderHistory = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
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
      .withIndex("by_user_externalOrderId", (q: any) =>
        q.eq("userId", args.userId).eq("externalOrderId", args.externalOrderId),
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
    connectionId: v.id("brokerConnections"),
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
      .withIndex("by_user_externalPositionId", (q: any) =>
        q.eq("userId", args.userId).eq("externalPositionId", args.externalPositionId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        organizationId: args.organizationId,
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
    connectionId: v.id("brokerConnections"),
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
    connectionId: v.id("brokerConnections"),
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

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const deletePaginated = async <T extends { _id: any }>(
  ctx: any,
  query: any,
  shouldDelete: (row: T) => boolean,
  maxDeletes: number,
): Promise<number> => {
  const rowsRaw = await query.take(maxDeletes);
  const rows: T[] = Array.isArray(rowsRaw) ? rowsRaw : [];
  let deleted = 0;
  for (const row of rows) {
    if (!shouldDelete(row)) continue;
    await ctx.db.delete(row._id);
    deleted += 1;
    if (deleted >= maxDeletes) break;
  }
  return deleted;
};

const deleteAll = async <T extends { _id: any }>(
  ctx: any,
  query: any,
  shouldDelete: (row: T) => boolean,
): Promise<number> => {
  const rowsRaw = await query.collect();
  const rows: T[] = Array.isArray(rowsRaw) ? rowsRaw : [];
  let deleted = 0;
  for (const row of rows) {
    if (!shouldDelete(row)) continue;
    await ctx.db.delete(row._id);
    deleted += 1;
  }
  return deleted;
};
export const deleteTradeDataForConnection = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    accountIds: v.optional(v.array(v.string())),
    maxDeletesPerTable: v.optional(v.number()),
  },
  returns: v.object({
    tradeOrders: v.number(),
    tradeExecutions: v.number(),
    tradeOrdersHistory: v.number(),
    tradePositions: v.number(),
    tradeRealizationEvents: v.number(),
    tradeAccountStates: v.number(),
    tradeIdeaGroups: v.number(),
    tradeIdeaEvents: v.number(),
    tradeIdeaNotes: v.number(),
  }),
  handler: async (ctx, args) => {
    const maxDeletes = clamp(args.maxDeletesPerTable ?? 5000, 200, 20000);
    const accountIds = Array.isArray(args.accountIds) ? args.accountIds.filter(Boolean) : [];

    const tradeOrdersQuery = ctx.db
      .query("tradeOrders")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", args.userId))
      .order("desc");
    const tradeOrders = await deletePaginated(
      ctx,
      tradeOrdersQuery,
      (row: any) => row.connectionId === args.connectionId,
      maxDeletes,
    );

    const tradeExecutionsQuery = ctx.db
      .query("tradeExecutions")
      .withIndex("by_user_executedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc");
    const tradeExecutions = await deletePaginated(
      ctx,
      tradeExecutionsQuery,
      (row: any) => row.connectionId === args.connectionId,
      maxDeletes,
    );

    const tradeOrdersHistoryQuery = ctx.db
      .query("tradeOrdersHistory")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", args.userId))
      .order("desc");
    const tradeOrdersHistory = await deletePaginated(
      ctx,
      tradeOrdersHistoryQuery,
      (row: any) => row.connectionId === args.connectionId,
      maxDeletes,
    );

    const tradePositionsQuery = ctx.db
      .query("tradePositions")
      .withIndex("by_user_openedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc");
    const tradePositions = await deletePaginated(
      ctx,
      tradePositionsQuery,
      (row: any) => row.connectionId === args.connectionId,
      maxDeletes,
    );

    let tradeRealizationEvents = 0;
    if (accountIds.length > 0) {
      for (const accountId of accountIds) {
        const eventsQuery = ctx.db
          .query("tradeRealizationEvents")
          .withIndex("by_org_user_accountId_closedAt", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .eq("accountId", accountId),
          )
          .order("desc");
        tradeRealizationEvents += await deletePaginated(
          ctx,
          eventsQuery,
          (row: any) => row.connectionId === args.connectionId,
          maxDeletes,
        );
      }
    }

    let tradeAccountStates = 0;
    if (accountIds.length > 0) {
      for (const accountId of accountIds) {
        const stateRow = await ctx.db
          .query("tradeAccountStates")
          .withIndex("by_org_user_accountId", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .eq("accountId", accountId),
          )
          .first();
        if (stateRow && stateRow.connectionId === args.connectionId) {
          await ctx.db.delete(stateRow._id);
          tradeAccountStates += 1;
        }
      }
    }

    const deleteIdeaGroup = async (groupId: any): Promise<{ events: number; notes: number }> => {
      const eventsQuery = ctx.db
        .query("tradeIdeaEvents")
        .withIndex("by_user_tradeIdeaGroupId", (q: any) =>
          q.eq("userId", args.userId).eq("tradeIdeaGroupId", groupId),
        );
      const notesQuery = ctx.db
        .query("tradeIdeaNotes")
        .withIndex("by_user_tradeIdeaGroupId", (q: any) =>
          q.eq("userId", args.userId).eq("tradeIdeaGroupId", groupId),
        );
      const events = await deleteAll(ctx, eventsQuery, () => true);
      const notes = await deleteAll(ctx, notesQuery, () => true);
      return { events, notes };
    };

    let tradeIdeaGroups = 0;
    let tradeIdeaEvents = 0;
    let tradeIdeaNotes = 0;

    for (const status of ["open", "closed"] as const) {
      if (tradeIdeaGroups >= maxDeletes) break;
      const rows = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_user_status_openedAt", (q: any) =>
          q.eq("userId", args.userId).eq("status", status),
        )
        .order("desc")
        .take(maxDeletes);
      for (const group of rows as any[]) {
        if (group.connectionId !== args.connectionId) continue;
        const res = await deleteIdeaGroup(group._id);
        tradeIdeaEvents += res.events;
        tradeIdeaNotes += res.notes;
        await ctx.db.delete(group._id);
        tradeIdeaGroups += 1;
        if (tradeIdeaGroups >= maxDeletes) break;
      }
    }

    return {
      tradeOrders,
      tradeExecutions,
      tradeOrdersHistory,
      tradePositions,
      tradeRealizationEvents,
      tradeAccountStates,
      tradeIdeaGroups,
      tradeIdeaEvents,
      tradeIdeaNotes,
    };
  },
});
