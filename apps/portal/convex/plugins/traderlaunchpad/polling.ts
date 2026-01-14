"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";

import { internalAction } from "../../_generated/server";

// Avoid typed imports here (can cause TS deep instantiation errors).
const internal: any = require("../../_generated/api").internal;
const components: any = require("../../_generated/api").components;

const isMentorRole = (role: unknown): boolean => role === "owner" || role === "admin";

const logPoll = (event: string, metadata: Record<string, unknown>) => {
  // Keep logs easy to grep in Convex dashboard.
  console.log(`[traderlaunchpad.polling] ${event}`, metadata);
};

const getIsMentorForConnection = async (
  ctx: any,
  organizationId: string,
  userId: string,
): Promise<boolean> => {
  const role = await ctx.runQuery(
    internal.plugins.traderlaunchpad.roleQueries.getUserOrgRole,
    {
      organizationId: organizationId as any,
      userId: userId as any,
    },
  );
  return isMentorRole(role);
};

interface ConnectionCandidate {
  _id: string;
  organizationId: string;
  userId: string;
  lastSyncAt: number;
  lastBrokerActivityAt?: number;
}

const pollBatch = async (ctx: any, args: {
  batchName: string;
  tier: "active" | "warm";
  dueIntervalMs: number;
  activeWindowMs?: number;
  limit: number;
  filterConnection: (c: ConnectionCandidate) => Promise<boolean>;
  syncLimit?: number;
}) => {
  const now = Date.now();

  logPoll("tick_start", {
    batchName: args.batchName,
    tier: args.tier,
    dueIntervalMs: args.dueIntervalMs,
    activeWindowMs: args.activeWindowMs ?? null,
    limit: args.limit,
    now,
  });

  const candidates: ConnectionCandidate[] = await ctx.runQuery(
    components.launchthat_traderlaunchpad.connections.internalQueries
      .listConnectionsDueForPoll,
    {
      tier: args.tier,
      now,
      dueIntervalMs: args.dueIntervalMs,
      activeWindowMs: args.activeWindowMs,
      limit: args.limit * 4, // overfetch to allow role/tier filtering
    },
  );

  logPoll("candidates_fetched", {
    batchName: args.batchName,
    count: candidates.length,
  });

  const filtered: ConnectionCandidate[] = [];
  for (const c of candidates) {
    if (filtered.length >= args.limit) break;
    if (await args.filterConnection(c)) filtered.push(c);
  }

  logPoll("candidates_filtered", {
    batchName: args.batchName,
    count: filtered.length,
  });

  const leaseOwner = `cron:${args.batchName}`;
  const leaseMs = Math.min(Math.max(args.dueIntervalMs * 2, 30_000), 10 * 60 * 1000);

  const claimedIds: string[] = await ctx.runMutation(
    components.launchthat_traderlaunchpad.connections.mutations.claimSyncLeases,
    {
      connectionIds: filtered.map((c) => c._id),
      now,
      leaseMs,
      leaseOwner,
    },
  );
  const claimedSet = new Set(claimedIds);

  logPoll("leases_claimed", {
    batchName: args.batchName,
    leaseOwner,
    leaseMs,
    claimed: claimedIds.length,
  });

  for (const c of filtered) {
    if (!claimedSet.has(c._id)) continue;
    try {
      logPoll("sync_start", {
        batchName: args.batchName,
        connectionId: c._id,
        organizationId: c.organizationId,
        userId: c.userId,
      });
      await ctx.runAction(internal.plugins.traderlaunchpad.sync.syncTradeLockerConnection, {
        organizationId: c.organizationId,
        userId: c.userId,
        limit: args.syncLimit,
      });
      logPoll("sync_ok", {
        batchName: args.batchName,
        connectionId: c._id,
      });
    } catch (err) {
      logPoll("sync_err", {
        batchName: args.batchName,
        connectionId: c._id,
        err: err instanceof Error ? err.message : String(err),
      });
    } finally {
      // Always release the lease. We use 0/"" (instead of clearing) because schema fields are optional.
      await ctx.runMutation(
        components.launchthat_traderlaunchpad.connections.mutations
          .updateConnectionSyncState,
        {
          connectionId: c._id,
          syncLeaseUntil: 0,
          syncLeaseOwner: "",
        },
      );
    }
  }

  logPoll("tick_end", {
    batchName: args.batchName,
    synced: claimedIds.length,
  });
};

export const pollMentors = internalAction({
  args: {
    maxConnections: v.optional(v.number()),
    activeWindowMs: v.optional(v.number()),
    syncLimit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    logPoll("pollMentors_called", {
      maxConnections: args.maxConnections ?? null,
      activeWindowMs: args.activeWindowMs ?? null,
      syncLimit: args.syncLimit ?? null,
    });
    await pollBatch(ctx, {
      batchName: "tradelocker_mentors",
      // Mentors must poll fast even if we haven't seen recent broker activity yet.
      // Use the "warm" selector (by lastSyncAt) with a 60s interval.
      tier: "warm",
      dueIntervalMs: 60_000,
      activeWindowMs: args.activeWindowMs,
      limit: Math.max(1, Math.min(200, args.maxConnections ?? 20)),
      syncLimit: args.syncLimit,
      filterConnection: async (c) =>
        await getIsMentorForConnection(ctx, c.organizationId, c.userId),
    });
    return null;
  },
});

export const pollMembersActive = internalAction({
  args: {
    maxConnections: v.optional(v.number()),
    activeWindowMs: v.optional(v.number()),
    syncLimit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    logPoll("pollMembersActive_called", {
      maxConnections: args.maxConnections ?? null,
      activeWindowMs: args.activeWindowMs ?? null,
      syncLimit: args.syncLimit ?? null,
    });
    await pollBatch(ctx, {
      batchName: "tradelocker_members_active",
      tier: "active",
      dueIntervalMs: 180_000,
      activeWindowMs: args.activeWindowMs,
      limit: Math.max(1, Math.min(500, args.maxConnections ?? 50)),
      syncLimit: args.syncLimit,
      filterConnection: async (c) =>
        !(await getIsMentorForConnection(ctx, c.organizationId, c.userId)),
    });
    return null;
  },
});

export const pollMembersWarm = internalAction({
  args: {
    maxConnections: v.optional(v.number()),
    activeWindowMs: v.optional(v.number()),
    syncLimit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    logPoll("pollMembersWarm_called", {
      maxConnections: args.maxConnections ?? null,
      activeWindowMs: args.activeWindowMs ?? null,
      syncLimit: args.syncLimit ?? null,
    });
    const now = Date.now();
    const activeWindowMs = Math.max(
      10_000,
      Math.min(24 * 60 * 60 * 1000, args.activeWindowMs ?? 30 * 60 * 1000),
    );
    const activeSince = now - activeWindowMs;

    await pollBatch(ctx, {
      batchName: "tradelocker_members_warm",
      tier: "warm",
      dueIntervalMs: 600_000,
      activeWindowMs,
      limit: Math.max(1, Math.min(1000, args.maxConnections ?? 100)),
      syncLimit: args.syncLimit,
      filterConnection: async (c) => {
        // Keep warm tier strictly for non-mentors and non-active accounts.
        if (await getIsMentorForConnection(ctx, c.organizationId, c.userId)) return false;
        const lastActivity =
          typeof c.lastBrokerActivityAt === "number" ? c.lastBrokerActivityAt : 0;
        if (lastActivity >= activeSince) return false;
        return true;
      },
    });

    return null;
  },
});


