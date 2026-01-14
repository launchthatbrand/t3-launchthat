/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-type-assertion
*/

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { query } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../../core/organizations/helpers";
import { getAuthenticatedUserId } from "../../lib/permissions/userAuth";

const connectionsQueries = components.launchthat_traderlaunchpad.connections
  .queries as any;
const tradeIdeasQueries = components.launchthat_traderlaunchpad.tradeIdeas
  .queries as any;
const rawQueries = components.launchthat_traderlaunchpad.raw.queries as any;

const tradeOrderView = v.object({
  // NOTE: These rows come from a mounted Convex component (`components.launchthat_traderlaunchpad`).
  // Component table IDs are NOT valid for host `v.id("...")` validators, even if the table name matches.
  // Treat IDs as opaque strings at this boundary (consistent with other plugins in this repo).
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
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );

    const connection = await ctx.runQuery(connectionsQueries.getMyConnection, {
      organizationId: String(args.organizationId),
      userId: String(userId),
    });
    if (!connection) return null;

    const now = Date.now();

    // Determine mentor vs member (owners/admins are mentors for polling).
    const membership = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q: any) =>
        q.eq("userId", userId).eq("organizationId", args.organizationId),
      )
      .first();
    const role = membership?.role;
    const isMentor = role === "owner" || role === "admin";

    // Determine active vs warm for members.
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

export const listMyTradeIdeas = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.union(v.literal("open"), v.literal("closed")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );

    const result = await ctx.runQuery(tradeIdeasQueries.listByStatus, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      status: args.status,
      paginationOpts: args.paginationOpts,
    });

    // Debug visibility: helps confirm the UI is querying the expected scope.
    try {
      console.log("[traderlaunchpad.listMyTradeIdeas]", {
        organizationId: String(args.organizationId),
        userId: String(userId),
        status: args.status,
        numItems: Array.isArray((result as any)?.page)
          ? (result as any).page.length
          : null,
        isDone: (result as any)?.isDone ?? null,
      });
    } catch {
      // ignore
    }

    return result;
  },
});

export const listMyTradeLockerOrders = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderView),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );
    return await ctx.runQuery(rawQueries.listOrdersForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      limit: args.limit,
    });
  },
});

export const listMyTradeLockerOrdersHistory = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradeOrderHistoryView),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );
    return await ctx.runQuery(rawQueries.listOrdersHistoryForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      limit: args.limit,
    });
  },
});

export const listMyTradeLockerPositions = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(tradePositionView),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );
    return await ctx.runQuery(rawQueries.listPositionsForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      limit: args.limit,
    });
  },
});

export const getMyTradeLockerAccountState = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.union(tradeAccountStateView, v.null()),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );

    const connection = await ctx.runQuery(connectionsQueries.getMyConnection, {
      organizationId: String(args.organizationId),
      userId: String(userId),
    });
    const accountId = String((connection as any)?.selectedAccountId ?? "");
    if (!accountId) return null;

    return await ctx.runQuery(rawQueries.getAccountStateForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      accountId,
    });
  },
});

export const getTradeIdeaWithExecutions = query({
  args: {
    organizationId: v.id("organizations"),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );

    const group = await ctx.runQuery(tradeIdeasQueries.getById, {
      tradeIdeaGroupId: args.tradeIdeaGroupId,
    });
    if (!group) return null;

    // Basic access control: users can only view their own trades for MVP.
    if (String((group as any).userId ?? "") !== String(userId)) {
      throw new Error("Unauthorized");
    }

    const openedAt =
      typeof (group as any).openedAt === "number" ? (group as any).openedAt : 0;
    const closedAt =
      typeof (group as any).closedAt === "number"
        ? (group as any).closedAt
        : undefined;

    const executions = await ctx.runQuery(rawQueries.listExecutionsForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
      fromExecutedAt: Math.max(0, openedAt - 60_000),
      toExecutedAt:
        typeof closedAt === "number" ? closedAt + 60_000 : undefined,
      limit: 500,
    });

    return { group, executions };
  },
});
