import { v } from "convex/values";

import { mutation } from "../server";

export const upsertConnection = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("connected"),
      v.literal("error"),
      v.literal("disconnected"),
    ),
    lastError: v.optional(v.string()),
  },
  returns: v.id("brokerConnections"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("brokerConnections")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        provider:
          typeof (existing as any).provider === "string"
            ? (existing as any).provider
            : "tradelocker",
        environment: args.environment,
        server: args.server,
        jwtHost: args.jwtHost,
        selectedAccountId: args.selectedAccountId,
        selectedAccNum: args.selectedAccNum,
        accessTokenEncrypted: args.accessTokenEncrypted,
        refreshTokenEncrypted: args.refreshTokenEncrypted,
        accessTokenExpiresAt: args.accessTokenExpiresAt,
        refreshTokenExpiresAt: args.refreshTokenExpiresAt,
        status: args.status,
        lastError: args.lastError,
        // Ensure it is always present (required by schema).
        lastSyncAt:
          typeof (existing as any).lastSyncAt === "number" ? (existing as any).lastSyncAt : 0,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("brokerConnections", {
      organizationId: args.organizationId,
      userId: args.userId,
      provider: "tradelocker",
      environment: args.environment,
      server: args.server,
      jwtHost: args.jwtHost,
      selectedAccountId: args.selectedAccountId,
      selectedAccNum: args.selectedAccNum,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      refreshTokenExpiresAt: args.refreshTokenExpiresAt,
      status: args.status,
      lastError: args.lastError,
      lastSyncAt: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateConnectionSyncState = mutation({
  args: {
    connectionId: v.id("brokerConnections"),
    lastSyncAt: v.optional(v.number()),
    lastBrokerActivityAt: v.optional(v.number()),
    hasOpenTrade: v.optional(v.boolean()),
    syncLeaseUntil: v.optional(v.number()),
    syncLeaseOwner: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("connected"),
        v.literal("error"),
        v.literal("disconnected"),
      ),
    ),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (typeof args.lastSyncAt === "number") patch.lastSyncAt = args.lastSyncAt;
    if (typeof args.lastBrokerActivityAt === "number")
      patch.lastBrokerActivityAt = args.lastBrokerActivityAt;
    if (typeof args.hasOpenTrade === "boolean") patch.hasOpenTrade = args.hasOpenTrade;
    if (typeof args.syncLeaseUntil === "number") patch.syncLeaseUntil = args.syncLeaseUntil;
    if (typeof args.syncLeaseOwner === "string") patch.syncLeaseOwner = args.syncLeaseOwner;
    if (typeof args.status === "string") patch.status = args.status;
    if (typeof args.lastError === "string") patch.lastError = args.lastError;
    await ctx.db.patch(args.connectionId, patch);
    return null;
  },
});

export const deleteConnection = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("brokerConnections")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return null;
  },
});

export const deleteConnectionAccountsByConnectionId = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
  },
  returns: v.object({
    deleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("brokerConnectionAccounts")
      .withIndex("by_connectionId", (q: any) => q.eq("connectionId", args.connectionId))
      .collect();

    let deleted = 0;
    for (const row of rows) {
      if (row.organizationId !== args.organizationId || row.userId !== args.userId) continue;
      await ctx.db.delete(row._id);
      deleted += 1;
    }
    return { deleted };
  },
});

export const upsertConnectionAccount = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    accountId: v.string(),
    accNum: v.number(),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("brokerConnectionAccounts"),
  handler: async (ctx, args) => {
    const conn = await ctx.db.get(args.connectionId);
    if (!conn) throw new Error("Connection not found");
    if (conn.organizationId !== args.organizationId || conn.userId !== args.userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("brokerConnectionAccounts")
      .withIndex("by_connectionId", (q: any) => q.eq("connectionId", args.connectionId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("accNum"), args.accNum),
          q.eq(q.field("accountId"), args.accountId),
        ),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        currency: args.currency,
        status: args.status,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("brokerConnectionAccounts", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      accountId: args.accountId,
      accNum: args.accNum,
      name: args.name,
      currency: args.currency,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setConnectionSelectedAccount = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const conn = await ctx.db.get(args.connectionId);
    if (!conn) throw new Error("Connection not found");
    if (conn.organizationId !== args.organizationId || conn.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.connectionId, {
      selectedAccountId: args.selectedAccountId,
      selectedAccNum: args.selectedAccNum,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateConnectionAccountDebug = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountRowId: v.id("brokerConnectionAccounts"),
    lastConfigOk: v.boolean(),
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
    lastConfigError: v.optional(v.string()),
    lastConfigRaw: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.accountRowId);
    if (!row) throw new Error("Account not found");
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.accountRowId, {
      lastConfigOk: args.lastConfigOk,
      customerAccess: args.customerAccess,
      lastConfigError: args.lastConfigError,
      lastConfigRaw: args.lastConfigRaw,
      lastConfigCheckedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const claimSyncLeases = mutation({
  args: {
    connectionIds: v.array(v.id("brokerConnections")),
    now: v.number(),
    leaseMs: v.number(),
    leaseOwner: v.string(),
  },
  returns: v.array(v.id("brokerConnections")),
  handler: async (ctx, args) => {
    const now = args.now;
    const leaseMs = Math.max(1_000, Math.min(30 * 60 * 1000, args.leaseMs));
    const leaseUntil = now + leaseMs;

    const claimed: Array<any> = [];
    for (const id of args.connectionIds) {
      const doc = await ctx.db.get(id);
      if (!doc) continue;
      if ((doc as any).status !== "connected") continue;

      const currentLeaseUntil =
        typeof (doc as any).syncLeaseUntil === "number" ? (doc as any).syncLeaseUntil : 0;
      if (currentLeaseUntil > now) continue;

      await ctx.db.patch(id, {
        syncLeaseUntil: leaseUntil,
        syncLeaseOwner: args.leaseOwner,
        updatedAt: now,
      });
      claimed.push(id);
    }

    return claimed;
  },
});
