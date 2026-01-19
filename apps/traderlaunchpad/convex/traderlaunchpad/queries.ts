/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

const connectionsQueries = components.launchthat_traderlaunchpad.connections
  .queries as any;
const rawQueries = components.launchthat_traderlaunchpad.raw.queries as any;
const journalQueries = components.launchthat_traderlaunchpad.journal
  .queries as any;
const tradeIdeasQueries = components.launchthat_traderlaunchpad.tradeIdeas
  .queries as any;
const tradeIdeasAnalytics = components.launchthat_traderlaunchpad.tradeIdeas
  .analytics as any;
const tradeIdeasNotes = components.launchthat_traderlaunchpad.tradeIdeas.notes as any;

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

const tradeExecutionView = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.string(),
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
});

export const getMyTradeLockerConnection = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      connection: v.any(),
      accounts: v.array(v.any()),
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

    const accounts = await ctx.runQuery(
      connectionsQueries.listMyConnectionAccounts,
      {
        organizationId,
        userId,
        connectionId: (connection as any)._id,
      } as any,
    );

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
      accounts: Array.isArray(accounts) ? accounts : [],
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

export const listMyTradeLockerOrdersForInstrument = query({
  args: {
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listOrdersForUserByInstrumentId, {
      organizationId,
      userId,
      instrumentId: args.instrumentId,
      limit: args.limit,
    });
  },
});

export const listMyTradeLockerOrdersHistoryForInstrument = query({
  args: {
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderHistoryView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(
      rawQueries.listOrdersHistoryForUserByInstrumentId,
      {
        organizationId,
        userId,
        instrumentId: args.instrumentId,
        limit: args.limit,
      },
    );
  },
});

export const listMyTradeLockerExecutionsForInstrument = query({
  args: {
    instrumentId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeExecutionView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listExecutionsForUserByInstrumentId, {
      organizationId,
      userId,
      instrumentId: args.instrumentId,
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

export const getMyTradeLockerOrderDetail = query({
  args: {
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
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.getOrderById, {
      organizationId,
      userId,
      orderId: args.orderId,
      kind: args.kind,
    });
  },
});

export const listMyTradeLockerExecutionsForOrder = query({
  args: {
    externalOrderId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeExecutionView),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(rawQueries.listExecutionsForOrder, {
      organizationId,
      userId,
      externalOrderId: args.externalOrderId,
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

export const getMyTradeIdeaAnalyticsSummary = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sampleSize: v.number(),
    closedTrades: v.number(),
    openTrades: v.number(),
    winRate: v.number(),
    avgWin: v.number(),
    avgLoss: v.number(),
    expectancy: v.number(),
    totalFees: v.number(),
    totalPnl: v.number(),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasAnalytics.getSummary, {
      organizationId,
      userId,
      limit: args.limit,
    });
  },
});

export const listMyTradeIdeaAnalyticsByInstrument = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      instrumentId: v.string(),
      symbol: v.string(),
      trades: v.number(),
      winRate: v.number(),
      totalPnl: v.number(),
      avgPnl: v.number(),
      lastOpenedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasAnalytics.listByInstrument, {
      organizationId,
      userId,
      limit: args.limit,
    });
  },
});

export const listMyTradeIdeasByStatus = query({
  args: {
    status: v.union(v.literal("open"), v.literal("closed")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasQueries.listByStatus, {
      organizationId,
      userId,
      status: args.status,
      paginationOpts: args.paginationOpts,
    });
  },
});

export const getMyTradeIdeaById = query({
  args: {
    tradeIdeaGroupId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tradeIdeasQueries.getById, {
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
    });
  },
});

export const listMyTradeIdeaEvents = query({
  args: {
    tradeIdeaGroupId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasQueries.listEventsForGroup, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
      limit: args.limit,
    } as any);
  },
});

export const getMyTradeIdeaNoteForGroup = query({
  args: {
    tradeIdeaGroupId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      tradeIdeaGroupId: v.string(),
      reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
      reviewedAt: v.optional(v.number()),
      thesis: v.optional(v.string()),
      setup: v.optional(v.string()),
      mistakes: v.optional(v.string()),
      outcome: v.optional(v.string()),
      nextTime: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasNotes.getNoteForGroup, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
    });
  },
});

export const listMyNextTradeIdeasToReview = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaGroupId: v.string(),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      direction: v.union(v.literal("long"), v.literal("short")),
      closedAt: v.number(),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
      reviewedAt: v.optional(v.number()),
      noteUpdatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.runQuery(tradeIdeasNotes.listNextToReview, {
      organizationId,
      userId,
      limit: args.limit,
    });
    return (rows ?? []).map((r: any) => ({
      tradeIdeaGroupId: String(r.tradeIdeaGroupId),
      symbol: String(r.symbol ?? "UNKNOWN"),
      instrumentId: typeof r.instrumentId === "string" ? r.instrumentId : undefined,
      direction: r.direction === "short" ? "short" : "long",
      closedAt: Number(r.closedAt ?? 0),
      realizedPnl: typeof r.realizedPnl === "number" ? r.realizedPnl : undefined,
      fees: typeof r.fees === "number" ? r.fees : undefined,
      reviewStatus: r.reviewStatus === "reviewed" ? "reviewed" : "todo",
      reviewedAt: typeof r.reviewedAt === "number" ? r.reviewedAt : undefined,
      noteUpdatedAt: typeof r.noteUpdatedAt === "number" ? r.noteUpdatedAt : undefined,
    }));
  },
});
