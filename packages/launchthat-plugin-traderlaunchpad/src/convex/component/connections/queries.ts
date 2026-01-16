import { v } from "convex/values";

import { query } from "../server";

export const getMyConnection = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradelockerConnections"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
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
      .query("tradelockerConnections")
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
