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
const journalQueries = components.launchthat_traderlaunchpad.journal.queries as any;

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

const publicTradePositionView = v.object({
  externalPositionId: v.string(),
  symbol: v.optional(v.string()),
  instrumentId: v.optional(v.string()),
  side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
  openedAt: v.optional(v.number()),
  qty: v.optional(v.number()),
  avgPrice: v.optional(v.number()),
  updatedAt: v.number(),
});

const publicTradeIdeaView = v.object({
  tradeIdeaGroupId: v.string(),
  positionId: v.optional(v.string()),
  symbol: v.string(),
  status: v.union(v.literal("open"), v.literal("closed")),
  direction: v.union(v.literal("long"), v.literal("short")),
  openedAt: v.number(),
  closedAt: v.optional(v.number()),
  netQty: v.number(),
  avgEntryPrice: v.optional(v.number()),
  fees: v.optional(v.number()),
  lastExecutionAt: v.optional(v.number()),
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

export const getMyJournalProfile = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    isPublic: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId: Id<"users"> = await getAuthenticatedUserId(ctx);
    await verifyOrganizationAccessWithClerkContext(
      ctx,
      args.organizationId,
      userId,
    );

    const profile = await ctx.runQuery(journalQueries.getProfileForUser, {
      organizationId: String(args.organizationId),
      userId: String(userId),
    });

    return {
      isPublic: profile ? Boolean(profile.isPublic) : true,
    };
  },
});

/**
 * Public journal profile lookup for /journal/u/:username routes.
 *
 * NOTE:
 * - Defaults to `isPublic=true` if no journalProfile row exists yet.
 * - Scopes by organization when provided to avoid cross-tenant username collisions.
 */
export const getPublicJournalProfileByUsername = query({
  args: {
    username: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.null(),
    v.object({
      isPublic: v.boolean(),
      userId: v.string(),
      organizationId: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username) return null;

    const orgId = args.organizationId ? String(args.organizationId) : null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!user) return null;

    // When org is specified, constrain user to that org.
    if (orgId && user.organizationId && String(user.organizationId) !== orgId) {
      return null;
    }

    const profile = await ctx.runQuery(journalQueries.getProfileForUser, {
      organizationId: orgId ?? (user.organizationId ? String(user.organizationId) : ""),
      userId: String(user._id),
    });

    return {
      isPublic: profile ? Boolean(profile.isPublic) : true,
      userId: String(user._id),
      organizationId: user.organizationId ? String(user.organizationId) : null,
    };
  },
});

export const listPublicPositionsByUsername = query({
  args: {
    username: v.string(),
    organizationId: v.optional(v.id("organizations")),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicTradePositionView),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username) return [];
    const orgId = args.organizationId ? String(args.organizationId) : null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();
    if (!user) return [];
    if (orgId && user.organizationId && String(user.organizationId) !== orgId) {
      return [];
    }

    const profile = await ctx.runQuery(journalQueries.getProfileForUser, {
      organizationId: orgId ?? (user.organizationId ? String(user.organizationId) : ""),
      userId: String(user._id),
    });
    if (profile && profile.isPublic === false) return [];

    const rows = await ctx.runQuery(rawQueries.listPositionsForUser, {
      organizationId: orgId ?? (user.organizationId ? String(user.organizationId) : ""),
      userId: String(user._id),
      limit: args.limit,
    });

    return (Array.isArray(rows) ? rows : []).map((p: any) => ({
      externalPositionId: String(p.externalPositionId ?? ""),
      symbol: typeof p.symbol === "string" ? p.symbol : undefined,
      instrumentId: typeof p.instrumentId === "string" ? p.instrumentId : undefined,
      side: p.side === "buy" || p.side === "sell" ? p.side : undefined,
      openedAt: typeof p.openedAt === "number" ? p.openedAt : undefined,
      qty: typeof p.qty === "number" ? p.qty : undefined,
      avgPrice: typeof p.avgPrice === "number" ? p.avgPrice : undefined,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now(),
    }));
  },
});

export const listPublicTradeIdeasByUsername = query({
  args: {
    username: v.string(),
    organizationId: v.optional(v.id("organizations")),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(publicTradeIdeaView),
  handler: async (ctx, args) => {
    const username = args.username.trim();
    if (!username) return [];
    const orgId = args.organizationId ? String(args.organizationId) : null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();
    if (!user) return [];
    if (orgId && user.organizationId && String(user.organizationId) !== orgId) {
      return [];
    }

    const profile = await ctx.runQuery(journalQueries.getProfileForUser, {
      organizationId: orgId ?? (user.organizationId ? String(user.organizationId) : ""),
      userId: String(user._id),
    });
    if (profile && profile.isPublic === false) return [];

    const status = args.status ?? "open";
    const result = await ctx.runQuery(tradeIdeasQueries.listByStatus, {
      organizationId: orgId ?? (user.organizationId ? String(user.organizationId) : ""),
      userId: String(user._id),
      status,
      paginationOpts: { numItems: Math.max(1, Math.min(50, args.limit ?? 20)), cursor: null },
    });

    const page = Array.isArray((result as any)?.page) ? (result as any).page : [];
    return page.map((g: any) => ({
      tradeIdeaGroupId: String(g._id),
      positionId: typeof g.positionId === "string" ? g.positionId : undefined,
      symbol: String(g.symbol ?? ""),
      status: g.status === "closed" ? "closed" : "open",
      direction: g.direction === "short" ? "short" : "long",
      openedAt: Number(g.openedAt ?? 0),
      closedAt: typeof g.closedAt === "number" ? g.closedAt : undefined,
      netQty: typeof g.netQty === "number" ? g.netQty : 0,
      avgEntryPrice: typeof g.avgEntryPrice === "number" ? g.avgEntryPrice : undefined,
      fees: typeof g.fees === "number" ? g.fees : undefined,
      lastExecutionAt: typeof g.lastExecutionAt === "number" ? g.lastExecutionAt : undefined,
      updatedAt: typeof g.updatedAt === "number" ? g.updatedAt : Date.now(),
    }));
  },
});

export const getPublicLeaderboard = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      username: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
      openPositions: v.number(),
      openTradeIdeas: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const orgId = String(args.organizationId);
    const profiles = await ctx.runQuery(journalQueries.listPublicProfiles, {
      organizationId: orgId,
      limit: args.limit,
    });

    const out: Array<{
      userId: string;
      username: string | null;
      image: string | null;
      openPositions: number;
      openTradeIdeas: number;
    }> = [];

    for (const p of Array.isArray(profiles) ? profiles : []) {
      const userId = String((p as any).userId ?? "");
      if (!userId) continue;

      const user = await ctx.db.get(userId as any);
      const username =
        user && typeof (user as any).username === "string"
          ? (user as any).username
          : null;
      const image =
        user && typeof (user as any).image === "string" ? (user as any).image : null;

      const positions = await ctx.runQuery(rawQueries.listPositionsForUser, {
        organizationId: orgId,
        userId,
        limit: 500,
      });
      const openPositions = Array.isArray(positions) ? positions.length : 0;

      const tradeIdeas = await ctx.runQuery(tradeIdeasQueries.listByStatus, {
        organizationId: orgId,
        userId,
        status: "open",
        paginationOpts: { numItems: 50, cursor: null },
      });
      const openTradeIdeas = Array.isArray((tradeIdeas as any)?.page)
        ? (tradeIdeas as any).page.length
        : 0;

      out.push({
        userId,
        username,
        image,
        openPositions,
        openTradeIdeas,
      });
    }

    // Simple ranking: most open trade ideas, then open positions.
    out.sort((a, b) => {
      const dIdeas = b.openTradeIdeas - a.openTradeIdeas;
      if (dIdeas !== 0) return dIdeas;
      return b.openPositions - a.openPositions;
    });

    return out;
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
    // Component-scoped id from `components.launchthat_traderlaunchpad`.
    tradeIdeaGroupId: v.string(),
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

    const positionId = String((group as any).positionId ?? "");
    const executions = positionId
      ? await ctx.runQuery(rawQueries.listExecutionsForPosition, {
          organizationId: String(args.organizationId),
          userId: String(userId),
          positionId,
          limit: 500,
        })
      : [];

    return { group, executions };
  },
});
