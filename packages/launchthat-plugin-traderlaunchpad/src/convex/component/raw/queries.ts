import { query } from "../server";
import { v } from "convex/values";

export const listExecutionsForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    fromExecutedAt: v.optional(v.number()),
    toExecutedAt: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeExecutions"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const from =
      typeof args.fromExecutedAt === "number" ? args.fromExecutedAt : 0;
    const to =
      typeof args.toExecutedAt === "number"
        ? args.toExecutedAt
        : Number.MAX_SAFE_INTEGER;

    const rows = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_executedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .gte("executedAt", from)
          .lte("executedAt", to),
      )
      .order("asc")
      .take(limit);

    return rows;
  },
});

export const listExecutionsForPosition = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    positionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeExecutions"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const positionId = args.positionId.trim();
    if (!positionId) return [];

    const rows = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_externalPositionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalPositionId", positionId),
      )
      .order("asc")
      .take(limit);

    return rows;
  },
});

export const listOrdersForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeOrders"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const rows = await ctx.db
      .query("tradeOrders")
      .withIndex("by_org_user_createdAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const listOrdersHistoryForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeOrdersHistory"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const rows = await ctx.db
      .query("tradeOrdersHistory")
      .withIndex("by_org_user_createdAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

const tradeOrderView = v.object({
  _id: v.id("tradeOrders"),
  _creationTime: v.number(),
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
  updatedAt: v.number(),
});

const tradeOrderHistoryView = v.object({
  _id: v.id("tradeOrdersHistory"),
  _creationTime: v.number(),
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
  updatedAt: v.number(),
});

export const listOrdersForUserByInstrumentId = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeOrders"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const instrumentId = args.instrumentId.trim();
    if (!instrumentId) return [];
    const rows = await ctx.db
      .query("tradeOrders")
      .withIndex("by_org_user_instrumentId_updatedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("instrumentId", instrumentId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const listOrdersHistoryForUserByInstrumentId = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeOrdersHistory"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const instrumentId = args.instrumentId.trim();
    if (!instrumentId) return [];
    const rows = await ctx.db
      .query("tradeOrdersHistory")
      .withIndex("by_org_user_instrumentId_updatedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("instrumentId", instrumentId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const listExecutionsForUserByInstrumentId = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeExecutions"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const instrumentId = args.instrumentId.trim();
    if (!instrumentId) return [];
    const rows = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_instrumentId_executedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("instrumentId", instrumentId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const getOrderById = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    orderId: v.string(),
    kind: v.optional(v.union(v.literal("order"), v.literal("history"))),
  },
  returns: v.union(
    v.object({
      kind: v.literal("order"),
      order: tradeOrderView,
    }),
    v.object({
      kind: v.literal("history"),
      order: tradeOrderHistoryView,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const orderId = args.orderId.trim();
    if (!orderId) return null;
    if (args.kind === "history") {
      const history = await ctx.db.get(orderId as any);
      if (
        history &&
        history.organizationId === args.organizationId &&
        history.userId === args.userId
      ) {
        return { kind: "history" as const, order: history };
      }
      return null;
    }

    const order = await ctx.db.get(orderId as any);
    if (
      order &&
      order.organizationId === args.organizationId &&
      order.userId === args.userId
    ) {
      return { kind: "order" as const, order };
    }
    const history = await ctx.db.get(orderId as any);
    if (
      history &&
      history.organizationId === args.organizationId &&
      history.userId === args.userId
    ) {
      return { kind: "history" as const, order: history };
    }
    return null;
  },
});

export const listExecutionsForOrder = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    externalOrderId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeExecutions"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const externalOrderId = args.externalOrderId.trim();
    if (!externalOrderId) return [];
    const rows = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_externalOrderId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalOrderId", externalOrderId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const listPositionsForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradePositions"),
      _creationTime: v.number(),
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const rows = await ctx.db
      .query("tradePositions")
      .withIndex("by_org_user_openedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const getAccountStateForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeAccountStates"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
      accountId: v.string(),
      raw: v.any(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tradeAccountStates")
      .withIndex("by_org_user_accountId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", args.accountId),
      )
      .first();
    return row ?? null;
  },
});
