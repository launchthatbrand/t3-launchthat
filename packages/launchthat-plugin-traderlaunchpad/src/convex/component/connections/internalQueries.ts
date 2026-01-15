import { v } from "convex/values";

import { query } from "../server";

/**
 * Server-only access to encrypted tokens. In the host app, component functions are not
 * exposed to clients directly (they are referenced via `components.*`), so this is safe.
 */
export const getConnectionSecrets = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      connectionId: v.id("tradelockerConnections"),
      organizationId: v.string(),
      userId: v.string(),
      environment: v.union(v.literal("demo"), v.literal("live")),
      server: v.string(),
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
      connectionId: doc._id,
      organizationId: doc.organizationId,
      userId: doc.userId,
      environment: doc.environment,
      server: doc.server,
      selectedAccountId: doc.selectedAccountId,
      selectedAccNum: doc.selectedAccNum,
      accessTokenEncrypted: doc.accessTokenEncrypted,
      refreshTokenEncrypted: doc.refreshTokenEncrypted,
      accessTokenExpiresAt: doc.accessTokenExpiresAt,
      refreshTokenExpiresAt: doc.refreshTokenExpiresAt,
      status: doc.status,
    };
  },
});

export const listConnectionsDueForPoll = query({
  args: {
    tier: v.union(v.literal("active"), v.literal("warm")),
    now: v.number(),
    dueIntervalMs: v.number(),
    // Only used for tier="active"
    activeWindowMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradelockerConnections"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      status: v.union(
        v.literal("connected"),
        v.literal("error"),
        v.literal("disconnected"),
      ),
      lastSyncAt: v.number(),
      lastBrokerActivityAt: v.optional(v.number()),
      hasOpenTrade: v.optional(v.boolean()),
      syncLeaseUntil: v.optional(v.number()),
      syncLeaseOwner: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const now = args.now;
    const dueBefore = now - Math.max(1, args.dueIntervalMs);
    const limit = Math.max(1, Math.min(200, args.limit ?? 50));

    // Overfetch a bit then filter in memory (Convex doesn't support OR conditions across indexes).
    const overfetch = Math.max(limit * 4, limit);

    let candidates: Array<any> = [];
    if (args.tier === "active") {
      const activeWindowMs = Math.max(
        10_000,
        Math.min(24 * 60 * 60 * 1000, args.activeWindowMs ?? 30 * 60 * 1000),
      );
      const activeSince = now - activeWindowMs;
      candidates = await ctx.db
        .query("tradelockerConnections")
        .withIndex("by_status_and_lastBrokerActivityAt", (q: any) =>
          q.eq("status", "connected").gte("lastBrokerActivityAt", activeSince),
        )
        .order("desc")
        .take(overfetch);
    } else {
      candidates = await ctx.db
        .query("tradelockerConnections")
        .withIndex("by_status_and_lastSyncAt", (q: any) =>
          q.eq("status", "connected").lte("lastSyncAt", dueBefore),
        )
        .order("asc")
        .take(overfetch);
    }

    // Prefer most overdue connections.
    candidates.sort((a, b) => (a.lastSyncAt ?? 0) - (b.lastSyncAt ?? 0));

    const out: Array<any> = [];
    for (const c of candidates) {
      if (!c) continue;
      if (c.status !== "connected") continue;
      if (typeof c.lastSyncAt === "number" && c.lastSyncAt > dueBefore)
        continue;

      const leaseUntil =
        typeof c.syncLeaseUntil === "number" ? c.syncLeaseUntil : 0;
      if (leaseUntil > now) continue;

      out.push(c);
      if (out.length >= limit) break;
    }

    // IMPORTANT: Never return encrypted tokens (or any other extra fields) from this query.
    // Also, Convex return validators require we only return fields declared in `returns`.
    return out.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      organizationId: c.organizationId,
      userId: c.userId,
      status: c.status,
      lastSyncAt: c.lastSyncAt,
      lastBrokerActivityAt: c.lastBrokerActivityAt,
      hasOpenTrade: c.hasOpenTrade,
      syncLeaseUntil: c.syncLeaseUntil,
      syncLeaseOwner: c.syncLeaseOwner,
    }));
  },
});
