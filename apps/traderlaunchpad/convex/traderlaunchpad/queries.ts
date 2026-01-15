/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";

import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

const connectionsQueries = components.launchthat_traderlaunchpad.connections
  .queries as any;
const rawQueries = components.launchthat_traderlaunchpad.raw.queries as any;
const journalQueries = components.launchthat_traderlaunchpad.journal.queries as any;

const tradeOrderView = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.string(),
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
  _id: v.string(),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.string(),
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

const tradePositionView = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.string(),
  externalPositionId: v.string(),
  symbol: v.optional(v.string()),
  instrumentId: v.optional(v.string()),
  side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
  openedAt: v.optional(v.number()),
  qty: v.optional(v.number()),
  avgPrice: v.optional(v.number()),
  raw: v.any(),
  updatedAt: v.number(),
});

const tradeAccountStateView = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.string(),
  accountId: v.string(),
  raw: v.any(),
  updatedAt: v.number(),
});

export const getMyTradeLockerConnection = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      connection: v.any(),
      polling: v.object({
        now: v.number(),
        isMentor: v.boolean(),
        isActiveMember: v.boolean(),
        intervalMs: v.number(),
        lastSyncAt: v.number(),
        nextSyncAt: v.number(),
        isSyncing: v.boolean(),
        activeWindowMs: v.number(),
      }),
    }),
  ),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(connectionsQueries.getMyConnection, {
      organizationId,
      userId,
    });
    if (!connection) return null;

    const now = Date.now();

    // Standalone v0: no mentor concept; use activity-based tiers only.
    const isMentor = false;
    const activeWindowMs = 30 * 60 * 1000;
    const hasOpenTrade = Boolean((connection as any).hasOpenTrade);
    const lastBrokerActivityAt =
      typeof (connection as any).lastBrokerActivityAt === "number"
        ? (connection as any).lastBrokerActivityAt
        : 0;
    const isActiveMember =
      hasOpenTrade || now - lastBrokerActivityAt < activeWindowMs;

    const intervalMs = isMentor ? 60_000 : isActiveMember ? 180_000 : 600_000;

    const lastSyncAt =
      typeof (connection as any).lastSyncAt === "number"
        ? (connection as any).lastSyncAt
        : 0;
    const nextSyncAt = lastSyncAt > 0 ? lastSyncAt + intervalMs : now;

    const syncLeaseUntil =
      typeof (connection as any).syncLeaseUntil === "number"
        ? (connection as any).syncLeaseUntil
        : 0;
    const isSyncing = syncLeaseUntil > now;

    return {
      connection,
      polling: {
        now,
        isMentor,
        isActiveMember,
        intervalMs,
        lastSyncAt,
        nextSyncAt,
        isSyncing,
        activeWindowMs,
      },
    };
  },
});

export const getMyJournalProfile = query({
  args: {},
  returns: v.object({
    isPublic: v.boolean(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const profile = await ctx.runQuery(journalQueries.getProfileForUser, {
      organizationId,
      userId,
    });

    return {
      isPublic: profile ? Boolean(profile.isPublic) : true,
    };
  },
});

export const listMyTradeLockerOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listOrdersForUser, {
      organizationId,
      userId,
      limit: args.limit,
    });
  },
});

export const listMyTradeLockerOrdersHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderHistoryView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listOrdersHistoryForUser, {
      organizationId,
      userId,
      limit: args.limit,
    });
  },
});

export const listMyTradeLockerPositions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(tradePositionView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listPositionsForUser, {
      organizationId,
      userId,
      limit: args.limit,
    });
  },
});

export const getMyTradeLockerAccountState = query({
  args: {},
  returns: v.union(tradeAccountStateView, v.null()),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const connection = await ctx.runQuery(connectionsQueries.getMyConnection, {
      organizationId,
      userId,
    });
    const accountId = String((connection as any)?.selectedAccountId ?? "");
    if (!accountId) return null;

    return await ctx.runQuery(rawQueries.getAccountStateForUser, {
      organizationId,
      userId,
      accountId,
    });
  },
});


