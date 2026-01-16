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
  returns: v.id("tradelockerConnections"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradelockerConnections")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
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

    return await ctx.db.insert("tradelockerConnections", {
      organizationId: args.organizationId,
      userId: args.userId,
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
    connectionId: v.id("tradelockerConnections"),
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
      .query("tradelockerConnections")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();
    if (!existing) return null;
    await ctx.db.delete(existing._id);
    return null;
  },
});

export const claimSyncLeases = mutation({
  args: {
    connectionIds: v.array(v.id("tradelockerConnections")),
    now: v.number(),
    leaseMs: v.number(),
    leaseOwner: v.string(),
  },
  returns: v.array(v.id("tradelockerConnections")),
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
