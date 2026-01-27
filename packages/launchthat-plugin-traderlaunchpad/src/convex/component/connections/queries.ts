import { v } from "convex/values";

import { query } from "../server";

export const getMyConnection = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("brokerConnections"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      provider: v.optional(v.string()),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      selectedAccountId: v.string(),
      selectedAccNum: v.number(),
      status: v.union(
        v.literal("connected"),
        v.literal("error"),
        v.literal("disconnected"),
      ),
      lastError: v.optional(v.string()),
      lastSyncAt: v.number(),
      lastBrokerActivityAt: v.optional(v.number()),
      hasOpenTrade: v.optional(v.boolean()),
      syncLeaseUntil: v.optional(v.number()),
      syncLeaseOwner: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("brokerConnections")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();
    if (!doc) return null;
    return {
      _id: doc._id,
      _creationTime: doc._creationTime,
      organizationId: doc.organizationId,
      userId: doc.userId,
      provider: (doc as any).provider,
      environment: doc.environment,
      server: doc.server,
      jwtHost: doc.jwtHost,
      selectedAccountId: doc.selectedAccountId,
      selectedAccNum: doc.selectedAccNum,
      status: doc.status,
      lastError: doc.lastError,
      lastSyncAt: doc.lastSyncAt,
      lastBrokerActivityAt: doc.lastBrokerActivityAt,
      hasOpenTrade: doc.hasOpenTrade,
      syncLeaseUntil: doc.syncLeaseUntil,
      syncLeaseOwner: doc.syncLeaseOwner,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
});

export const getConnectionById = query({
  args: {
    connectionId: v.id("brokerConnections"),
  },
  returns: v.union(
    v.object({
      _id: v.id("brokerConnections"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      provider: v.optional(v.string()),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
      jwtHost: v.optional(v.string()),
      selectedAccountId: v.string(),
      selectedAccNum: v.number(),
      status: v.union(
        v.literal("connected"),
        v.literal("error"),
        v.literal("disconnected"),
      ),
      lastError: v.optional(v.string()),
      lastSyncAt: v.number(),
      lastBrokerActivityAt: v.optional(v.number()),
      hasOpenTrade: v.optional(v.boolean()),
      syncLeaseUntil: v.optional(v.number()),
      syncLeaseOwner: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.connectionId);
    if (!doc) return null;
    return {
      _id: doc._id,
      _creationTime: doc._creationTime,
      organizationId: doc.organizationId,
      userId: doc.userId,
      provider: (doc as any).provider,
      environment: doc.environment,
      server: doc.server,
      jwtHost: doc.jwtHost,
      selectedAccountId: doc.selectedAccountId,
      selectedAccNum: doc.selectedAccNum,
      status: doc.status,
      lastError: doc.lastError,
      lastSyncAt: doc.lastSyncAt,
      lastBrokerActivityAt: doc.lastBrokerActivityAt,
      hasOpenTrade: doc.hasOpenTrade,
      syncLeaseUntil: doc.syncLeaseUntil,
      syncLeaseOwner: doc.syncLeaseOwner,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
});

export const listMyConnectionAccounts = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
  },
  returns: v.array(
    v.object({
      _id: v.id("brokerConnectionAccounts"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("brokerConnections"),
      accountId: v.string(),
      accNum: v.number(),
      name: v.optional(v.string()),
      currency: v.optional(v.string()),
      status: v.optional(v.string()),
      customerAccess: v.optional(
        v.object({
          orders: v.boolean(),
          ordersHistory: v.boolean(),
          filledOrders: v.boolean(),
          positions: v.boolean(),
          symbolInfo: v.boolean(),
          marketDepth: v.boolean(),
        }),
      ),
      lastConfigOk: v.optional(v.boolean()),
      lastConfigCheckedAt: v.optional(v.number()),
      lastConfigError: v.optional(v.string()),
      lastConfigRaw: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("brokerConnectionAccounts")
      .withIndex("by_connectionId", (q: any) => q.eq("connectionId", args.connectionId))
      .collect();

    return rows
      .filter((r) => r.organizationId === args.organizationId && r.userId === args.userId)
      .sort((a, b) => (a.accNum ?? 0) - (b.accNum ?? 0))
      .map((r) => ({
        _id: r._id,
        _creationTime: r._creationTime,
        organizationId: r.organizationId,
        userId: r.userId,
        connectionId: r.connectionId,
        accountId: r.accountId,
        accNum: r.accNum,
        name: r.name,
        currency: r.currency,
        status: r.status,
        customerAccess: r.customerAccess,
        lastConfigOk: r.lastConfigOk,
        lastConfigCheckedAt: r.lastConfigCheckedAt,
        lastConfigError: r.lastConfigError,
        lastConfigRaw: r.lastConfigRaw,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
  },
});
