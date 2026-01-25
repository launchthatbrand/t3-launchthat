/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

const coreTenantQueries = components.launchthat_core_tenant.queries as any;

const connectionsQueries = components.launchthat_traderlaunchpad.connections
  .queries as any;
const rawQueries = components.launchthat_traderlaunchpad.raw.queries as any;
const journalQueries = components.launchthat_traderlaunchpad.journal
  .queries as any;
const tradeIdeasQueries = components.launchthat_traderlaunchpad.tradeIdeas
  .queries as any;
const tradeIdeasIdeas = (components.launchthat_traderlaunchpad.tradeIdeas as any)
  .ideas as any;
const tradeIdeasAnalytics = components.launchthat_traderlaunchpad.tradeIdeas
  .analytics as any;
const analyticsQueries = components.launchthat_traderlaunchpad.analytics.queries as any;
const tradeIdeasNotes = components.launchthat_traderlaunchpad.tradeIdeas.notes as any;
const tradeIdeasInternal = components.launchthat_traderlaunchpad.tradeIdeas.internalQueries as any;
const tradingPlans = components.launchthat_traderlaunchpad.tradingPlans.index as any;
const sharingModule = components.launchthat_traderlaunchpad.sharing as any;
const visibilityModule = components.launchthat_traderlaunchpad.visibility as any;
const pricedataSources = (components as any).launchthat_pricedata?.sources?.queries as
  | any
  | undefined;
const pricedataInstruments = (components as any).launchthat_pricedata?.instruments
  ?.queries as any | undefined;

const resolveMembershipForOrg = async (ctx: any, organizationId: string, userId: string) => {
  const memberships = (await ctx.runQuery(coreTenantQueries.listOrganizationsByUserId, {
    userId,
  })) as unknown as any[];

  const match =
    Array.isArray(memberships)
      ? memberships.find((m) => {
          const orgId = String((m as any)?.organizationId ?? (m as any)?.org?._id ?? "");
          return orgId === organizationId;
        })
      : null;

  if (!match) return null;
  if (!Boolean((match as any)?.isActive)) return null;

  const role = String((match as any)?.role ?? "");
  return { role };
};

export const listMySymbolTrades = query({
  args: {
    symbol: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaGroupId: v.string(),
      symbol: v.string(),
      direction: v.union(v.literal("long"), v.literal("short")),
      status: v.union(v.literal("open"), v.literal("closed")),
      openedAt: v.number(),
      closedAt: v.optional(v.number()),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const symbol = String(args.symbol ?? "").trim().toUpperCase();
    if (!symbol) return [];

    const limit = Math.max(1, Math.min(Number(args.limit ?? 50), 200));

    const rows = await ctx.runQuery(tradeIdeasQueries.listLatestForSymbol, {
      organizationId,
      userId,
      symbol,
      limit,
    });

    return (rows ?? []).map((r: any) => ({
      tradeIdeaGroupId: String(r._id),
      symbol: String(r.symbol ?? symbol),
      direction: r.direction === "short" ? "short" : "long",
      status: r.status === "closed" ? "closed" : "open",
      openedAt: Number(r.openedAt ?? 0),
      closedAt: typeof r.closedAt === "number" ? Number(r.closedAt) : undefined,
      realizedPnl: typeof r.realizedPnl === "number" ? Number(r.realizedPnl) : undefined,
      fees: typeof r.fees === "number" ? Number(r.fees) : undefined,
    }));
  },
});

export const listMyCalendarDailyStats = query({
  args: {
    accountId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(), // YYYY-MM-DD
      pnl: v.number(), // realized
      wins: v.number(),
      losses: v.number(),
      unrealizedPnl: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasAnalytics.listCalendarDailyStats, {
      organizationId,
      userId,
      accountId: args.accountId,
      daysBack: args.daysBack,
    });
  },
});

export const listMyCalendarRealizationEvents = query({
  args: {
    accountId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalEventId: v.string(),
      tradeIdeaGroupId: v.optional(v.string()),
      externalPositionId: v.string(),
      externalOrderId: v.optional(v.string()),
      symbol: v.union(v.string(), v.null()),
      direction: v.union(v.literal("long"), v.literal("short"), v.null()),
      openAtMs: v.optional(v.number()),
      openPrice: v.optional(v.number()),
      closePrice: v.optional(v.number()),
      commission: v.optional(v.number()),
      swap: v.optional(v.number()),
      openOrderId: v.optional(v.string()),
      openTradeId: v.optional(v.string()),
      closeTradeId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
      tradableInstrumentId: v.optional(v.string()),
      positionSide: v.optional(v.string()),
      orderType: v.optional(v.string()),
      closedAt: v.number(),
      realizedPnl: v.number(),
      fees: v.optional(v.number()),
      qtyClosed: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.runQuery(tradeIdeasAnalytics.listCalendarRealizationEvents, {
      organizationId,
      userId,
      accountId: args.accountId,
      daysBack: args.daysBack,
    });
    return (rows ?? []).map((r: any) => ({
      externalEventId: String(r.externalEventId ?? ""),
      tradeIdeaGroupId:
        typeof r.tradeIdeaGroupId === "string" ? String(r.tradeIdeaGroupId) : undefined,
      externalPositionId: String(r.externalPositionId ?? ""),
      externalOrderId: typeof r.externalOrderId === "string" ? r.externalOrderId : undefined,
      symbol: typeof r.symbol === "string" ? r.symbol : null,
      direction:
        r.direction === "short" ? "short" : r.direction === "long" ? "long" : null,
      openAtMs: typeof r.openAtMs === "number" ? r.openAtMs : undefined,
      openPrice: typeof r.openPrice === "number" ? r.openPrice : undefined,
      closePrice: typeof r.closePrice === "number" ? r.closePrice : undefined,
      commission: typeof r.commission === "number" ? r.commission : undefined,
      swap: typeof r.swap === "number" ? r.swap : undefined,
      openOrderId: typeof r.openOrderId === "string" ? r.openOrderId : undefined,
      openTradeId: typeof r.openTradeId === "string" ? r.openTradeId : undefined,
      closeTradeId: typeof r.closeTradeId === "string" ? r.closeTradeId : undefined,
      instrumentId: typeof r.instrumentId === "string" ? r.instrumentId : undefined,
      tradableInstrumentId:
        typeof r.tradableInstrumentId === "string" ? r.tradableInstrumentId : undefined,
      positionSide: typeof r.positionSide === "string" ? r.positionSide : undefined,
      orderType: typeof r.orderType === "string" ? r.orderType : undefined,
      closedAt: Number(r.closedAt ?? 0),
      realizedPnl: typeof r.realizedPnl === "number" ? r.realizedPnl : 0,
      fees: typeof r.fees === "number" ? r.fees : undefined,
      qtyClosed: typeof r.qtyClosed === "number" ? r.qtyClosed : undefined,
    }));
  },
});

export const listMyTradeIdeaRealizationEvents = query({
  args: {
    tradeIdeaGroupId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalEventId: v.string(),
      tradeIdeaGroupId: v.optional(v.string()),
      externalPositionId: v.string(),
      externalOrderId: v.optional(v.string()),
      openAtMs: v.optional(v.number()),
      openPrice: v.optional(v.number()),
      closePrice: v.optional(v.number()),
      commission: v.optional(v.number()),
      swap: v.optional(v.number()),
      openOrderId: v.optional(v.string()),
      openTradeId: v.optional(v.string()),
      closeTradeId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
      tradableInstrumentId: v.optional(v.string()),
      positionSide: v.optional(v.string()),
      orderType: v.optional(v.string()),
      closedAt: v.number(),
      realizedPnl: v.number(),
      fees: v.optional(v.number()),
      qtyClosed: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const tradeIdeaGroupId = String(args.tradeIdeaGroupId ?? "").trim();
    if (!tradeIdeaGroupId) return [];

    const tradeIdea = await ctx.runQuery(tradeIdeasQueries.getById, {
      tradeIdeaGroupId: tradeIdeaGroupId as any,
    });

    const rows = await ctx.runQuery(tradeIdeasAnalytics.listTradeIdeaRealizationEvents, {
      organizationId,
      userId,
      tradeIdeaGroupId: tradeIdeaGroupId as any,
      limit: args.limit,
    });

    // Fallback for older events that predate tradeIdeaGroupId linking.
    const shouldFallback =
      (!rows || rows.length === 0) &&
      typeof (tradeIdea as any)?.accountId === "string" &&
      typeof (tradeIdea as any)?.positionId === "string";

    const fallbackRows = shouldFallback
      ? await ctx.runQuery(tradeIdeasAnalytics.listPositionRealizationEvents, {
          organizationId,
          userId,
          accountId: String((tradeIdea as any).accountId),
          positionId: String((tradeIdea as any).positionId),
          limit: args.limit,
        })
      : [];

    const out = (rows && rows.length > 0 ? rows : fallbackRows) ?? [];

    return out.map((r: any) => ({
      externalEventId: String(r.externalEventId ?? ""),
      tradeIdeaGroupId:
        typeof r.tradeIdeaGroupId === "string" ? String(r.tradeIdeaGroupId) : undefined,
      externalPositionId: String(r.externalPositionId ?? ""),
      externalOrderId: typeof r.externalOrderId === "string" ? r.externalOrderId : undefined,
      openAtMs: typeof r.openAtMs === "number" ? r.openAtMs : undefined,
      openPrice: typeof r.openPrice === "number" ? r.openPrice : undefined,
      closePrice: typeof r.closePrice === "number" ? r.closePrice : undefined,
      commission: typeof r.commission === "number" ? r.commission : undefined,
      swap: typeof r.swap === "number" ? r.swap : undefined,
      openOrderId: typeof r.openOrderId === "string" ? r.openOrderId : undefined,
      openTradeId: typeof r.openTradeId === "string" ? r.openTradeId : undefined,
      closeTradeId: typeof r.closeTradeId === "string" ? r.closeTradeId : undefined,
      instrumentId: typeof r.instrumentId === "string" ? r.instrumentId : undefined,
      tradableInstrumentId:
        typeof r.tradableInstrumentId === "string" ? r.tradableInstrumentId : undefined,
      positionSide: typeof r.positionSide === "string" ? r.positionSide : undefined,
      orderType: typeof r.orderType === "string" ? r.orderType : undefined,
      closedAt: Number(r.closedAt ?? 0),
      realizedPnl: typeof r.realizedPnl === "number" ? r.realizedPnl : 0,
      fees: typeof r.fees === "number" ? r.fees : undefined,
      qtyClosed: typeof r.qtyClosed === "number" ? r.qtyClosed : undefined,
    }));
  },
});

export const runMyAnalyticsReport = query({
  args: {
    accountId: v.optional(v.string()),
    spec: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(analyticsQueries.runAnalyticsReport, {
      organizationId,
      userId,
      accountId: args.accountId,
      spec: args.spec,
    });
  },
});

export const listMyAnalyticsReports = query({
  args: {},
  returns: v.array(
    v.object({
      reportId: v.string(),
      name: v.string(),
      accountId: v.optional(v.string()),
      visibility: v.union(v.literal("private"), v.literal("link")),
      shareToken: v.optional(v.string()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.runQuery(analyticsQueries.listMyAnalyticsReports, {
      organizationId,
      userId,
    });
    return (rows ?? []).map((r: any) => ({
      reportId: String(r.reportId ?? ""),
      name: String(r.name ?? ""),
      accountId: typeof r.accountId === "string" ? r.accountId : undefined,
      visibility: r.visibility === "link" ? "link" : "private",
      shareToken: typeof r.shareToken === "string" ? r.shareToken : undefined,
      updatedAt: Number(r.updatedAt ?? 0),
      createdAt: Number(r.createdAt ?? 0),
    }));
  },
});

export const getMyAnalyticsReport = query({
  args: {
    reportId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(analyticsQueries.getMyAnalyticsReport, {
      organizationId,
      userId,
      reportId: args.reportId as any,
    });
  },
});

export const getSharedAnalyticsReport = query({
  args: {
    shareToken: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(analyticsQueries.getSharedAnalyticsReport, {
      shareToken: args.shareToken,
    });
  },
});

export const listOrgUsers = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
    includeInactive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
      role: v.string(),
      isActive: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return [];
    if (membership.role !== "owner" && membership.role !== "admin") return [];

    const limit = Math.max(1, Math.min(Number(args.limit ?? 200), 500));
    const includeInactive = Boolean(args.includeInactive);

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const members = Array.isArray(membersRaw) ? membersRaw : [];
    const filtered = members.filter((m) => includeInactive || Boolean((m as any)?.isActive));

    const rows = await Promise.all(
      filtered.slice(0, limit).map(async (m) => {
        const userId = String((m as any)?.userId ?? "");
        const role = String((m as any)?.role ?? "viewer");
        const isActive = Boolean((m as any)?.isActive);
        if (!userId) {
          return null;
        }

        const user = await ctx.db
          .query("users")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", userId))
          .first();

        return {
          userId,
          email: typeof (user as any)?.email === "string" ? String((user as any).email) : null,
          name: typeof (user as any)?.name === "string" ? String((user as any).name) : null,
          image: typeof (user as any)?.image === "string" ? String((user as any).image) : null,
          role,
          isActive,
        };
      }),
    );

    return rows.filter((r): r is NonNullable<typeof r> => Boolean(r));
  },
});

export const listOrgUserInvites = query({
  args: {
    organizationId: v.string(),
    includeExpired: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      email: v.string(),
      role: v.string(),
      token: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
      redeemedAt: v.optional(v.number()),
      revokedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return [];
    if (membership.role !== "owner" && membership.role !== "admin") return [];

    const includeExpired = Boolean(args.includeExpired);
    const limit = Math.max(1, Math.min(Number(args.limit ?? 100), 500));
    const now = Date.now();

    const rows = await ctx.db
      .query("orgUserInvites")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
      .order("desc")
      .take(limit);

    return rows
      .filter((r) => includeExpired || r.expiresAt > now)
      .map((r) => ({
        _id: String(r._id),
        email: String(r.email ?? "").trim(),
        role: String(r.role ?? "viewer"),
        token: String(r.token ?? ""),
        createdAt: Number(r.createdAt ?? 0),
        expiresAt: Number(r.expiresAt ?? 0),
        redeemedAt: typeof r.redeemedAt === "number" ? r.redeemedAt : undefined,
        revokedAt: typeof r.revokedAt === "number" ? r.revokedAt : undefined,
      }));
  },
});

export const listMySymbolStats = query({
  args: {
    limit: v.optional(v.number()),
    accountId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      symbol: v.string(),
      tradeCount: v.number(),
      totalPnl: v.number(),
      lastClosedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const limit = Math.max(10, Math.min(Number(args.limit ?? 500), 2000));
    const rows = await ctx.runQuery(tradeIdeasNotes.listRecentClosedWithReviewStatus, {
      organizationId,
      userId,
      limit,
      accountId: args.accountId,
    });

    const statsBySymbol: Record<
      string,
      { symbol: string; tradeCount: number; totalPnl: number; lastClosedAt: number }
    > = {};

    for (const r of rows ?? []) {
      const symbol = String((r as any)?.symbol ?? "").trim().toUpperCase() || "UNKNOWN";
      const closedAt = Number((r as any)?.closedAt ?? 0);
      const pnl = typeof (r as any)?.realizedPnl === "number" ? (r as any).realizedPnl : 0;

      const cur =
        statsBySymbol[symbol] ??
        (statsBySymbol[symbol] = { symbol, tradeCount: 0, totalPnl: 0, lastClosedAt: 0 });
      cur.tradeCount += 1;
      cur.totalPnl += pnl;
      if (closedAt > cur.lastClosedAt) cur.lastClosedAt = closedAt;
    }

    return Object.values(statsBySymbol);
  },
});

export const listOrgSymbolStats = query({
  args: {
    organizationId: v.string(),
    limitPerUser: v.optional(v.number()),
    maxMembers: v.optional(v.number()),
    accountId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      rows: v.array(
        v.object({
          symbol: v.string(),
          tradeCount: v.number(),
          totalPnl: v.number(),
          lastClosedAt: v.number(),
        }),
      ),
      memberCountTotal: v.number(),
      memberCountConsidered: v.number(),
      isTruncated: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();

    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return null;

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const activeMembers = Array.isArray(membersRaw)
      ? membersRaw.filter((m) => Boolean((m as any)?.isActive))
      : [];

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const limitPerUser = clamp(args.limitPerUser ?? 200, 10, 500);
    const maxMembers = clamp(args.maxMembers ?? 100, 1, 200);
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";

    const memberCountTotal = activeMembers.length;
    const considered = activeMembers.slice(0, maxMembers);
    const memberCountConsidered = considered.length;
    const isTruncated = memberCountConsidered < memberCountTotal;

    const statsBySymbol: Record<
      string,
      { symbol: string; tradeCount: number; totalPnl: number; lastClosedAt: number }
    > = {};

    // Aggregate per member.
    for (const m of considered) {
      const userId = String((m as any)?.userId ?? "");
      if (!userId) continue;

      const rows = await ctx.runQuery(tradeIdeasNotes.listRecentClosedWithReviewStatus, {
        organizationId,
        userId,
        limit: limitPerUser,
        accountId: accountId || undefined,
      });

      for (const r of rows ?? []) {
        const symbol = String((r as any)?.symbol ?? "").trim().toUpperCase() || "UNKNOWN";
        const closedAt = Number((r as any)?.closedAt ?? 0);
        const pnl = typeof (r as any)?.realizedPnl === "number" ? (r as any).realizedPnl : 0;

        const cur =
          statsBySymbol[symbol] ??
          (statsBySymbol[symbol] = { symbol, tradeCount: 0, totalPnl: 0, lastClosedAt: 0 });
        cur.tradeCount += 1;
        cur.totalPnl += pnl;
        if (closedAt > cur.lastClosedAt) cur.lastClosedAt = closedAt;
      }
    }

    return {
      rows: Object.values(statsBySymbol),
      memberCountTotal,
      memberCountConsidered,
      isTruncated,
    };
  },
});

export const listOrgSymbolLatestTrades = query({
  args: {
    organizationId: v.string(),
    symbol: v.string(),
    maxMembers: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
      role: v.union(v.string(), v.null()),
      group: v.union(
        v.null(),
        v.object({
          tradeIdeaGroupId: v.string(),
          symbol: v.string(),
          direction: v.union(v.literal("long"), v.literal("short")),
          status: v.union(v.literal("open"), v.literal("closed")),
          openedAt: v.number(),
          closedAt: v.optional(v.number()),
          realizedPnl: v.optional(v.number()),
          fees: v.optional(v.number()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return [];
    if (membership.role !== "owner" && membership.role !== "admin") return [];

    const symbol = String(args.symbol ?? "").trim().toUpperCase();
    if (!symbol) return [];

    const maxMembers = Math.max(1, Math.min(Number(args.maxMembers ?? 100), 200));

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const activeMembers = Array.isArray(membersRaw)
      ? membersRaw.filter((m) => Boolean((m as any)?.isActive))
      : [];

    const rows = await Promise.all(
      activeMembers.slice(0, maxMembers).map(async (m) => {
        const userId = String((m as any)?.userId ?? "");
        if (!userId) return null;

        const user = await ctx.db
          .query("users")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", userId))
          .first();

        const latest = await ctx.runQuery(tradeIdeasInternal.getLatestGroupForSymbol, {
          organizationId,
          userId,
          symbol,
        });

        const group =
          latest && typeof latest === "object"
            ? {
                tradeIdeaGroupId: String((latest as any)._id),
                symbol: String((latest as any).symbol ?? symbol),
                direction:
                  (latest as any).direction === "short"
                    ? ("short" as const)
                    : ("long" as const),
                status:
                  (latest as any).status === "closed"
                    ? ("closed" as const)
                    : ("open" as const),
                openedAt: Number((latest as any).openedAt ?? 0),
                closedAt:
                  typeof (latest as any).closedAt === "number"
                    ? Number((latest as any).closedAt)
                    : undefined,
                realizedPnl:
                  typeof (latest as any).realizedPnl === "number"
                    ? Number((latest as any).realizedPnl)
                    : undefined,
                fees:
                  typeof (latest as any).fees === "number"
                    ? Number((latest as any).fees)
                    : undefined,
              }
            : null;

        return {
          userId,
          email: typeof (user as any)?.email === "string" ? String((user as any).email) : null,
          name: typeof (user as any)?.name === "string" ? String((user as any).name) : null,
          role: typeof (m as any)?.role === "string" ? String((m as any).role) : null,
          group,
        };
      }),
    );

    return rows.filter((r): r is NonNullable<typeof r> => Boolean(r));
  },
});

export const getOrgTradeIdeaAnalyticsSummary = query({
  args: {
    organizationId: v.optional(v.string()),
    limitPerUser: v.optional(v.number()),
    maxMembers: v.optional(v.number()),
    accountId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      sampleSize: v.number(),
      closedTrades: v.number(),
      openTrades: v.number(),
      totalFees: v.number(),
      totalPnl: v.number(),
      memberCountTotal: v.number(),
      memberCountConsidered: v.number(),
      isTruncated: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const viewerUserId = await resolveViewerUserId(ctx);

    // Prefer explicit org context passed by the app (tenant headers -> TenantProvider).
    // This is the most reliable in local dev where we may not have orgId embedded in the token.
    const organizationIdFromArgs =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : null;

    // Fallback: attempt to infer from identity (server-minted tokens) or from env default.
    const rawOrgIdCandidates = [
      (identity as any)?.organizationId,
      (identity as any)?.claims?.organizationId,
      (identity as any)?.customClaims?.organizationId,
      (identity as any)?.tokenClaims?.organizationId,
    ];
    const rawOrgId =
      rawOrgIdCandidates.find((v) => typeof v === "string" && v.trim()) ?? null;

    const organizationId = organizationIdFromArgs
      ? organizationIdFromArgs
      : rawOrgId
        ? String(rawOrgId).trim()
        : resolveOrganizationId();

    // Authorization: viewer must be a member of this organization.
    const viewerMemberships = (await ctx.runQuery(
      coreTenantQueries.listOrganizationsByUserId,
      { userId: viewerUserId },
    )) as unknown as any[];

    const isMember = Array.isArray(viewerMemberships)
      ? viewerMemberships.some((m) => {
          const orgId =
            (m && typeof m === "object" && (m as any).organizationId) ??
            (m && typeof m === "object" && (m as any).org?._id) ??
            "";
          return String(orgId) === String(organizationId);
        })
      : false;

    if (!isMember) return null;

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const activeMembers = Array.isArray(membersRaw)
      ? membersRaw.filter((m) => Boolean((m as any)?.isActive))
      : [];

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const limitPerUser = clamp(args.limitPerUser ?? 200, 10, 500);
    const maxMembers = clamp(args.maxMembers ?? 100, 1, 200);
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";

    const memberCountTotal = activeMembers.length;
    const considered = activeMembers.slice(0, maxMembers);
    const memberCountConsidered = considered.length;
    const isTruncated = memberCountConsidered < memberCountTotal;

    const summaries = await Promise.all(
      considered.map(async (m) => {
        const userId = String((m as any)?.userId ?? "");
        if (!userId) return null;
        const summary = await ctx.runQuery(tradeIdeasAnalytics.getSummary, {
          organizationId,
          userId,
          accountId: accountId || undefined,
          limit: limitPerUser,
        });
        return summary && typeof summary === "object" ? (summary as any) : null;
      }),
    );

    let sampleSize = 0;
    let closedTrades = 0;
    let openTrades = 0;
    let totalFees = 0;
    let totalPnl = 0;

    for (const s of summaries) {
      if (!s) continue;
      sampleSize += typeof s.sampleSize === "number" ? s.sampleSize : 0;
      closedTrades += typeof s.closedTrades === "number" ? s.closedTrades : 0;
      openTrades += typeof s.openTrades === "number" ? s.openTrades : 0;
      totalFees += typeof s.totalFees === "number" ? s.totalFees : 0;
      totalPnl += typeof s.totalPnl === "number" ? s.totalPnl : 0;
    }

    return {
      sampleSize,
      closedTrades,
      openTrades,
      totalFees,
      totalPnl,
      memberCountTotal,
      memberCountConsidered,
      isTruncated,
    };
  },
});

export const listOrgTradingPlans = query({
  args: {
    organizationId: v.string(),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      name: v.string(),
      version: v.string(),
      archivedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return [];

    const rows = await ctx.runQuery(tradingPlans.listOrgTradingPlans, {
      organizationId,
      includeArchived: args.includeArchived,
      limit: args.limit,
    });

    return (rows ?? []).map((r: any) => ({
      _id: String(r._id),
      name: String(r.name ?? "Untitled"),
      version: String(r.version ?? "v1.0"),
      archivedAt: typeof r.archivedAt === "number" ? Number(r.archivedAt) : undefined,
      createdAt: Number(r.createdAt ?? 0),
      updatedAt: Number(r.updatedAt ?? 0),
    }));
  },
});

export const getOrgTradingPlanPolicy = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.object({
    allowedPlanIds: v.array(v.string()),
    forcedPlanId: v.union(v.string(), v.null()),
    updatedAt: v.union(v.number(), v.null()),
    updatedByUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) {
      return { allowedPlanIds: [], forcedPlanId: null, updatedAt: null, updatedByUserId: null };
    }

    const policy = await ctx.runQuery(tradingPlans.getOrgTradingPlanPolicy, { organizationId });

    const allowedPlanIds = Array.isArray((policy as any)?.allowedPlanIds)
      ? (policy as any).allowedPlanIds.map((id: any) => String(id))
      : [];

    const forcedPlanId =
      (policy as any)?.forcedPlanId && typeof (policy as any).forcedPlanId === "string"
        ? String((policy as any).forcedPlanId)
        : null;

    return {
      allowedPlanIds,
      forcedPlanId,
      updatedAt: typeof (policy as any)?.updatedAt === "number" ? Number((policy as any).updatedAt) : null,
      updatedByUserId:
        typeof (policy as any)?.updatedByUserId === "string" ? String((policy as any).updatedByUserId) : null,
    };
  },
});

export const getMyOrgTradingPlan = query({
  args: {
    organizationId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.string(),
      name: v.string(),
      version: v.string(),
      strategySummary: v.string(),
      markets: v.array(v.string()),
      sessions: v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          timezone: v.string(),
          days: v.array(v.string()),
          start: v.string(),
          end: v.string(),
        }),
      ),
      risk: v.object({
        maxRiskPerTradePct: v.number(),
        maxDailyLossPct: v.number(),
        maxWeeklyLossPct: v.number(),
        maxOpenPositions: v.number(),
        maxTradesPerDay: v.number(),
      }),
      rules: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          category: v.union(
            v.literal("Entry"),
            v.literal("Risk"),
            v.literal("Exit"),
            v.literal("Process"),
            v.literal("Psychology"),
          ),
          severity: v.union(v.literal("hard"), v.literal("soft")),
        }),
      ),
      kpis: v.object({
        adherencePct: v.number(),
        sessionDisciplinePct7d: v.number(),
        avgRiskPerTradePct7d: v.number(),
        journalCompliancePct: v.number(),
        violations7d: v.number(),
      }),
      archivedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return null;

    const plan = await ctx.runQuery(tradingPlans.getMyOrgTradingPlan, {
      organizationId,
      userId: viewerUserId,
    });
    if (!plan) return null;

    return {
      _id: String((plan as any)._id),
      name: String((plan as any).name ?? "Untitled"),
      version: String((plan as any).version ?? "v1.0"),
      strategySummary: String((plan as any).strategySummary ?? ""),
      markets: Array.isArray((plan as any).markets) ? (plan as any).markets.map((m: any) => String(m)) : [],
      sessions: Array.isArray((plan as any).sessions)
        ? (plan as any).sessions.map((s: any) => ({
            id: String(s?.id ?? ""),
            label: String(s?.label ?? ""),
            timezone: String(s?.timezone ?? ""),
            days: Array.isArray(s?.days) ? s.days.map((d: any) => String(d)) : [],
            start: String(s?.start ?? ""),
            end: String(s?.end ?? ""),
          }))
        : [],
      risk: {
        maxRiskPerTradePct: Number((plan as any).risk?.maxRiskPerTradePct ?? 0),
        maxDailyLossPct: Number((plan as any).risk?.maxDailyLossPct ?? 0),
        maxWeeklyLossPct: Number((plan as any).risk?.maxWeeklyLossPct ?? 0),
        maxOpenPositions: Number((plan as any).risk?.maxOpenPositions ?? 0),
        maxTradesPerDay: Number((plan as any).risk?.maxTradesPerDay ?? 0),
      },
      rules: Array.isArray((plan as any).rules)
        ? (plan as any).rules.map((r: any) => ({
            id: String(r?.id ?? ""),
            title: String(r?.title ?? ""),
            description: String(r?.description ?? ""),
            category:
              r?.category === "Risk" ||
              r?.category === "Exit" ||
              r?.category === "Process" ||
              r?.category === "Psychology"
                ? r.category
                : "Entry",
            severity: r?.severity === "hard" ? "hard" : "soft",
          }))
        : [],
      kpis: {
        adherencePct: Number((plan as any).kpis?.adherencePct ?? 0),
        sessionDisciplinePct7d: Number((plan as any).kpis?.sessionDisciplinePct7d ?? 0),
        avgRiskPerTradePct7d: Number((plan as any).kpis?.avgRiskPerTradePct7d ?? 0),
        journalCompliancePct: Number((plan as any).kpis?.journalCompliancePct ?? 0),
        violations7d: Number((plan as any).kpis?.violations7d ?? 0),
      },
      archivedAt: typeof (plan as any).archivedAt === "number" ? Number((plan as any).archivedAt) : undefined,
      createdAt: Number((plan as any).createdAt ?? 0),
      updatedAt: Number((plan as any).updatedAt ?? 0),
    };
  },
});

export const getOrgTradingPlanCumulativeSummary = query({
  args: {
    organizationId: v.string(),
    planId: v.optional(v.string()),
    limitPerUser: v.optional(v.number()),
    maxMembers: v.optional(v.number()),
    accountId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      sampleSize: v.number(),
      closedTrades: v.number(),
      openTrades: v.number(),
      totalFees: v.number(),
      totalPnl: v.number(),
      memberCountTotal: v.number(),
      memberCountEligible: v.number(),
      memberCountConsidered: v.number(),
      isTruncated: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return null;

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const activeMembers = Array.isArray(membersRaw)
      ? membersRaw.filter((m) => Boolean((m as any)?.isActive))
      : [];

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const limitPerUser = clamp(args.limitPerUser ?? 200, 10, 500);
    const maxMembers = clamp(args.maxMembers ?? 100, 1, 200);
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";
    const planIdFilter = typeof args.planId === "string" && args.planId.trim() ? args.planId.trim() : "";

    const eligible: Array<{ userId: string; planId: string }> = [];
    for (const m of activeMembers) {
      const userId = String((m as any)?.userId ?? "");
      if (!userId) continue;
      const plan = await ctx.runQuery(tradingPlans.getMyOrgTradingPlan, { organizationId, userId });
      if (!plan) continue;
      const planId = String((plan as any)?._id ?? "");
      if (!planId) continue;
      if (planIdFilter && planId !== planIdFilter) continue;
      eligible.push({ userId, planId });
    }

    const memberCountTotal = activeMembers.length;
    const memberCountEligible = eligible.length;
    const considered = eligible.slice(0, maxMembers);
    const memberCountConsidered = considered.length;
    const isTruncated = memberCountConsidered < memberCountEligible;

    const summaries = await Promise.all(
      considered.map(async (m) => {
        const summary = await ctx.runQuery(tradeIdeasAnalytics.getSummary, {
          organizationId,
          userId: m.userId,
          accountId: accountId || undefined,
          limit: limitPerUser,
        });
        return summary && typeof summary === "object" ? (summary as any) : null;
      }),
    );

    let sampleSize = 0;
    let closedTrades = 0;
    let openTrades = 0;
    let totalFees = 0;
    let totalPnl = 0;

    for (const s of summaries) {
      if (!s) continue;
      sampleSize += typeof s.sampleSize === "number" ? s.sampleSize : 0;
      closedTrades += typeof s.closedTrades === "number" ? s.closedTrades : 0;
      openTrades += typeof s.openTrades === "number" ? s.openTrades : 0;
      totalFees += typeof s.totalFees === "number" ? s.totalFees : 0;
      totalPnl += typeof s.totalPnl === "number" ? s.totalPnl : 0;
    }

    return {
      sampleSize,
      closedTrades,
      openTrades,
      totalFees,
      totalPnl,
      memberCountTotal,
      memberCountEligible,
      memberCountConsidered,
      isTruncated,
    };
  },
});

export const getOrgTradingPlanLeaderboard = query({
  args: {
    organizationId: v.string(),
    planId: v.optional(v.string()),
    limitPerUser: v.optional(v.number()),
    maxMembers: v.optional(v.number()),
    accountId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      name: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
      planId: v.string(),
      sampleSize: v.number(),
      closedTrades: v.number(),
      openTrades: v.number(),
      totalFees: v.number(),
      totalPnl: v.number(),
      rank: v.number(),
      percentile: v.number(),
      isViewer: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const viewerUserId = await resolveViewerUserId(ctx);
    const organizationId = args.organizationId.trim();
    const membership = await resolveMembershipForOrg(ctx, organizationId, viewerUserId);
    if (!membership) return [];

    const membersRaw = (await ctx.runQuery(coreTenantQueries.listMembersByOrganizationId, {
      organizationId,
    })) as unknown as any[];

    const activeMembers = Array.isArray(membersRaw)
      ? membersRaw.filter((m) => Boolean((m as any)?.isActive))
      : [];

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const limitPerUser = clamp(args.limitPerUser ?? 200, 10, 500);
    const maxMembers = clamp(args.maxMembers ?? 100, 1, 200);
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";
    const planIdFilter = typeof args.planId === "string" && args.planId.trim() ? args.planId.trim() : "";

    const eligibleUserIds: string[] = [];
    const userIdToPlanId: Record<string, string> = {};

    for (const m of activeMembers) {
      const userId = String((m as any)?.userId ?? "");
      if (!userId) continue;
      const plan = await ctx.runQuery(tradingPlans.getMyOrgTradingPlan, { organizationId, userId });
      if (!plan) continue;
      const planId = String((plan as any)?._id ?? "");
      if (!planId) continue;
      if (planIdFilter && planId !== planIdFilter) continue;
      eligibleUserIds.push(userId);
      userIdToPlanId[userId] = planId;
    }

    const consideredUserIds = eligibleUserIds.slice(0, maxMembers);
    const summaries = await Promise.all(
      consideredUserIds.map(async (userId) => {
        const summary = await ctx.runQuery(tradeIdeasAnalytics.getSummary, {
          organizationId,
          userId,
          accountId: accountId || undefined,
          limit: limitPerUser,
        });
        return { userId, summary: summary && typeof summary === "object" ? (summary as any) : null };
      }),
    );

    const rows = await Promise.all(
      summaries.map(async ({ userId, summary }) => {
        const viewer = await ctx.db
          .query("users")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", userId))
          .first();

        return {
          userId,
          name: typeof (viewer as any)?.name === "string" ? String((viewer as any).name) : null,
          image: typeof (viewer as any)?.image === "string" ? String((viewer as any).image) : null,
          planId: userIdToPlanId[userId] ?? "",
          sampleSize: typeof summary?.sampleSize === "number" ? summary.sampleSize : 0,
          closedTrades: typeof summary?.closedTrades === "number" ? summary.closedTrades : 0,
          openTrades: typeof summary?.openTrades === "number" ? summary.openTrades : 0,
          totalFees: typeof summary?.totalFees === "number" ? summary.totalFees : 0,
          totalPnl: typeof summary?.totalPnl === "number" ? summary.totalPnl : 0,
          isViewer: userId === viewerUserId,
        };
      }),
    );

    const sorted = rows.sort((a, b) => b.totalPnl - a.totalPnl);
    const n = sorted.length;

    return sorted.map((row, idx) => {
      const rank = idx + 1;
      const percentile = n > 0 ? Math.round(((n - rank + 1) / n) * 100) : 0;
      return { ...row, rank, percentile };
    });
  },
});

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

export const getMyConnectionAccountById = query({
  args: {
    accountRowId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      provider: v.string(),
      connection: v.any(),
      account: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
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

    const list = Array.isArray(accounts) ? accounts : [];
    const account =
      list.find((row: any) => String(row?._id ?? "") === args.accountRowId) ??
      null;

    if (!account) return null;

    return {
      provider: "tradelocker",
      connection,
      account,
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

export const getMyPriceDataSymbolsByTradableInstrumentIds = query({
  args: { tradableInstrumentIds: v.array(v.string()) },
  returns: v.array(
    v.object({ tradableInstrumentId: v.string(), symbol: v.string() }),
  ),
  handler: async (ctx, args) => {
    if (!pricedataSources || !pricedataInstruments) return [];

    const ids = Array.isArray(args.tradableInstrumentIds)
      ? args.tradableInstrumentIds.map((id) => id.trim()).filter(Boolean)
      : [];
    if (ids.length === 0) return [];

    const source = await ctx.runQuery(pricedataSources.getDefaultSource, {});
    const sourceKey =
      typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) return [];

    const rows = await ctx.runQuery(
      pricedataInstruments.listInstrumentsByTradableInstrumentIds,
      {
        sourceKey,
        tradableInstrumentIds: ids,
      },
    );

    return Array.isArray(rows) ? rows : [];
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
    accountId: v.optional(v.string()),
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
      accountId: args.accountId,
    });
  },
});

export const listMyTradeIdeaAnalyticsByInstrument = query({
  args: {
    limit: v.optional(v.number()),
    accountId: v.optional(v.string()),
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
      accountId: args.accountId,
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
    accountId: v.optional(v.string()),
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
      accountId: args.accountId,
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

export const listMyRecentClosedTradeIdeas = query({
  args: {
    limit: v.optional(v.number()),
    accountId: v.optional(v.string()),
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
    const rows = await ctx.runQuery(
      tradeIdeasNotes.listRecentClosedWithReviewStatus,
      {
        organizationId,
        userId,
        limit: args.limit,
        accountId: args.accountId,
      },
    );
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

export const listMyTradeIdeas = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaId: v.string(),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      positionsCount: v.number(),
      realizedPnl: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.runQuery(tradeIdeasIdeas.listMyTradeIdeas, {
      organizationId,
      userId,
      limit: args.limit,
    });
    return (rows ?? []).map((r: any) => ({
      tradeIdeaId: String(r.tradeIdeaId),
      symbol: String(r.symbol ?? ""),
      instrumentId: typeof r.instrumentId === "string" ? r.instrumentId : undefined,
      bias: r.bias === "neutral" ? "neutral" : r.bias === "short" ? "short" : "long",
      timeframe: String(r.timeframe ?? "custom"),
      timeframeLabel: typeof r.timeframeLabel === "string" ? r.timeframeLabel : undefined,
      thesis: typeof r.thesis === "string" ? r.thesis : undefined,
      tags: Array.isArray(r.tags) ? r.tags : undefined,
      visibility: r.visibility === "public" ? "public" : r.visibility === "link" ? "link" : "private",
      status: r.status === "closed" ? "closed" : "active",
      openedAt: Number(r.openedAt ?? 0),
      lastActivityAt: Number(r.lastActivityAt ?? 0),
      positionsCount: Number(r.positionsCount ?? 0),
      realizedPnl: Number(r.realizedPnl ?? 0),
      updatedAt: Number(r.updatedAt ?? 0),
    }));
  },
});

export const getMyTradeIdeaSettings = query({
  args: {},
  returns: v.object({
    groupingWindowMs: v.number(),
    splitOnDirectionFlip: v.boolean(),
    defaultTimeframe: v.string(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(tradeIdeasIdeas.getMyTradeIdeaSettings, {
      organizationId,
      userId,
    });
  },
});

export const getMyShareVisibilitySettings = query({
  args: {},
  returns: v.object({
    globalEnabled: v.boolean(),
    tradeIdeasEnabled: v.boolean(),
    ordersEnabled: v.boolean(),
    positionsEnabled: v.boolean(),
    profileEnabled: v.boolean(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(sharingModule.getMyShareVisibilitySettings, {
      organizationId,
      userId,
    });
  },
});

export const getMyVisibilitySettings = query({
  args: {},
  returns: v.object({
    globalPublic: v.boolean(),
    tradeIdeasPublic: v.boolean(),
    ordersPublic: v.boolean(),
    positionsPublic: v.boolean(),
    profilePublic: v.boolean(),
    analyticsReportsPublic: v.boolean(),
  }),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(visibilityModule.getMyVisibilitySettings, {
      organizationId,
      userId,
    });
  },
});

// DEBUG: callable via `convex run` (internal only)
export const debugListRecentTradeIdeaPairs = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      userId: v.string(),
      ideas: v.number(),
      groups: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.runQuery(tradeIdeasIdeas.debugListRecentTradeIdeaPairs, {
      limit: args.limit,
    });
  },
});

// DEBUG: callable via `convex run` (internal only)
export const debugExplainTradeIdeaGroupingForUser = internalQuery({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    scanCap: v.optional(v.number()),
  },
  returns: v.object({
    settings: v.object({
      groupingWindowMs: v.number(),
      splitOnDirectionFlip: v.boolean(),
      defaultTimeframe: v.string(),
    }),
    ideas: v.array(
      v.object({
        tradeIdeaId: v.string(),
        symbol: v.string(),
        bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
        status: v.union(v.literal("active"), v.literal("closed")),
        openedAt: v.number(),
        lastActivityAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    groups: v.array(
      v.object({
        tradeIdeaGroupId: v.string(),
        positionId: v.string(),
        symbol: v.string(),
        instrumentId: v.optional(v.string()),
        direction: v.union(v.literal("long"), v.literal("short")),
        status: v.union(v.literal("open"), v.literal("closed")),
        openedAt: v.number(),
        lastExecutionAt: v.optional(v.number()),
        closedAt: v.optional(v.number()),
        tradeIdeaId: v.optional(v.string()),
      }),
    ),
    decisions: v.array(
      v.object({
        tradeIdeaGroupId: v.string(),
        symbol: v.string(),
        direction: v.union(v.literal("long"), v.literal("short")),
        openedAt: v.number(),
        derivedLastActivityAt: v.number(),
        matchedIdeaId_byLastActivity: v.optional(v.string()),
        matchedIdeaId_byOpenedAt: v.optional(v.string()),
        note: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const res = await ctx.runQuery(
      tradeIdeasIdeas.debugExplainTradeIdeaGroupingForUser,
      {
        organizationId: args.organizationId,
        userId: args.userId,
        scanCap: args.scanCap,
      },
    );
    return {
      settings: res.settings,
      ideas: (res.ideas ?? []).map((i: any) => ({
        tradeIdeaId: String(i.tradeIdeaId),
        symbol: String(i.symbol ?? ""),
        bias: i.bias === "neutral" ? "neutral" : i.bias === "short" ? "short" : "long",
        status: i.status === "closed" ? "closed" : "active",
        openedAt: Number(i.openedAt ?? 0),
        lastActivityAt: Number(i.lastActivityAt ?? 0),
        updatedAt: Number(i.updatedAt ?? 0),
      })),
      groups: (res.groups ?? []).map((g: any) => ({
        tradeIdeaGroupId: String(g.tradeIdeaGroupId),
        positionId: String(g.positionId ?? ""),
        symbol: String(g.symbol ?? ""),
        instrumentId: typeof g.instrumentId === "string" ? g.instrumentId : undefined,
        direction: g.direction === "short" ? "short" : "long",
        status: g.status === "closed" ? "closed" : "open",
        openedAt: Number(g.openedAt ?? 0),
        lastExecutionAt: typeof g.lastExecutionAt === "number" ? g.lastExecutionAt : undefined,
        closedAt: typeof g.closedAt === "number" ? g.closedAt : undefined,
        tradeIdeaId: typeof g.tradeIdeaId === "string" ? g.tradeIdeaId : undefined,
      })),
      decisions: (res.decisions ?? []).map((d: any) => ({
        tradeIdeaGroupId: String(d.tradeIdeaGroupId),
        symbol: String(d.symbol ?? ""),
        direction: d.direction === "short" ? "short" : "long",
        openedAt: Number(d.openedAt ?? 0),
        derivedLastActivityAt: Number(d.derivedLastActivityAt ?? 0),
        matchedIdeaId_byLastActivity:
          typeof d.matchedIdeaId_byLastActivity === "string"
            ? d.matchedIdeaId_byLastActivity
            : undefined,
        matchedIdeaId_byOpenedAt:
          typeof d.matchedIdeaId_byOpenedAt === "string"
            ? d.matchedIdeaId_byOpenedAt
            : undefined,
        note: String(d.note ?? ""),
      })),
    };
  },
});

export const getMyTradeIdeaDetail = query({
  args: {
    tradeIdeaId: v.string(),
    positionsLimit: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.object({
      tradeIdeaId: v.string(),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      shareToken: v.optional(v.string()),
      shareEnabledAt: v.optional(v.number()),
      expiresAt: v.optional(v.number()),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      positions: v.array(
        v.object({
          tradeIdeaGroupId: v.string(),
          symbol: v.string(),
          instrumentId: v.optional(v.string()),
          direction: v.union(v.literal("long"), v.literal("short")),
          status: v.union(v.literal("open"), v.literal("closed")),
          openedAt: v.number(),
          closedAt: v.optional(v.number()),
          realizedPnl: v.optional(v.number()),
          fees: v.optional(v.number()),
          netQty: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const detail = await ctx.runQuery(tradeIdeasIdeas.getMyTradeIdeaDetail, {
      organizationId,
      userId,
      tradeIdeaId: args.tradeIdeaId as any,
      positionsLimit: args.positionsLimit,
    });
    if (!detail) return null;

    const bias: "long" | "short" | "neutral" =
      detail.bias === "neutral"
        ? "neutral"
        : detail.bias === "short"
          ? "short"
          : "long";
    const visibility: "private" | "link" | "public" =
      detail.visibility === "public"
        ? "public"
        : detail.visibility === "link"
          ? "link"
          : "private";
    const status: "active" | "closed" =
      detail.status === "closed" ? "closed" : "active";

    return {
      tradeIdeaId: String(detail.tradeIdeaId),
      symbol: String(detail.symbol ?? ""),
      instrumentId: typeof detail.instrumentId === "string" ? detail.instrumentId : undefined,
      bias,
      timeframe: String(detail.timeframe ?? "custom"),
      timeframeLabel: typeof detail.timeframeLabel === "string" ? detail.timeframeLabel : undefined,
      thesis: typeof detail.thesis === "string" ? detail.thesis : undefined,
      tags: Array.isArray(detail.tags) ? detail.tags : undefined,
      visibility,
      shareToken: typeof detail.shareToken === "string" ? detail.shareToken : undefined,
      shareEnabledAt: typeof detail.shareEnabledAt === "number" ? detail.shareEnabledAt : undefined,
      expiresAt: typeof detail.expiresAt === "number" ? detail.expiresAt : undefined,
      status,
      openedAt: Number(detail.openedAt ?? 0),
      lastActivityAt: Number(detail.lastActivityAt ?? 0),
      positions: Array.isArray(detail.positions)
        ? detail.positions.map((p: any) => ({
            tradeIdeaGroupId: String(p.tradeIdeaGroupId),
            symbol: String(p.symbol ?? ""),
            instrumentId: typeof p.instrumentId === "string" ? p.instrumentId : undefined,
            direction: (p.direction === "short" ? "short" : "long") as "long" | "short",
            status: (p.status === "closed" ? "closed" : "open") as "open" | "closed",
            openedAt: Number(p.openedAt ?? 0),
            closedAt: typeof p.closedAt === "number" ? p.closedAt : undefined,
            realizedPnl: typeof p.realizedPnl === "number" ? p.realizedPnl : undefined,
            fees: typeof p.fees === "number" ? p.fees : undefined,
            netQty: Number(p.netQty ?? 0),
          }))
        : [],
    };
  },
});

export const listMyTradingPlans = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      name: v.string(),
      version: v.string(),
      archivedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const rows = await ctx.runQuery(tradingPlans.listTradingPlans, {
      organizationId,
      userId,
      includeArchived: args.includeArchived,
      limit: args.limit,
    });
    return (rows ?? []).map((r: any) => ({
      _id: String(r._id),
      name: String(r.name ?? "Untitled"),
      version: String(r.version ?? "v1.0"),
      archivedAt: typeof r.archivedAt === "number" ? Number(r.archivedAt) : undefined,
      createdAt: Number(r.createdAt ?? 0),
      updatedAt: Number(r.updatedAt ?? 0),
    }));
  },
});

export const getMyActiveTradingPlan = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.string(),
      name: v.string(),
      version: v.string(),
      strategySummary: v.string(),
      markets: v.array(v.string()),
      sessions: v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          timezone: v.string(),
          days: v.array(v.string()),
          start: v.string(),
          end: v.string(),
        }),
      ),
      risk: v.object({
        maxRiskPerTradePct: v.number(),
        maxDailyLossPct: v.number(),
        maxWeeklyLossPct: v.number(),
        maxOpenPositions: v.number(),
        maxTradesPerDay: v.number(),
      }),
      rules: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.string(),
          category: v.union(
            v.literal("Entry"),
            v.literal("Risk"),
            v.literal("Exit"),
            v.literal("Process"),
            v.literal("Psychology"),
          ),
          severity: v.union(v.literal("hard"), v.literal("soft")),
        }),
      ),
      kpis: v.object({
        adherencePct: v.number(),
        sessionDisciplinePct7d: v.number(),
        avgRiskPerTradePct7d: v.number(),
        journalCompliancePct: v.number(),
        violations7d: v.number(),
      }),
      archivedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    const plan = await ctx.runQuery(tradingPlans.getActiveTradingPlan, {
      organizationId,
      userId,
    });
    if (!plan) return null;
    return {
      _id: String((plan as any)._id),
      name: String((plan as any).name ?? "Untitled"),
      version: String((plan as any).version ?? "v1.0"),
      strategySummary: String((plan as any).strategySummary ?? ""),
      markets: Array.isArray((plan as any).markets)
        ? (plan as any).markets.map((m: any) => String(m))
        : [],
      sessions: Array.isArray((plan as any).sessions)
        ? (plan as any).sessions.map((s: any) => ({
          id: String(s?.id ?? ""),
          label: String(s?.label ?? ""),
          timezone: String(s?.timezone ?? ""),
          days: Array.isArray(s?.days) ? s.days.map((d: any) => String(d)) : [],
          start: String(s?.start ?? ""),
          end: String(s?.end ?? ""),
        }))
        : [],
      risk: {
        maxRiskPerTradePct: Number((plan as any).risk?.maxRiskPerTradePct ?? 0),
        maxDailyLossPct: Number((plan as any).risk?.maxDailyLossPct ?? 0),
        maxWeeklyLossPct: Number((plan as any).risk?.maxWeeklyLossPct ?? 0),
        maxOpenPositions: Number((plan as any).risk?.maxOpenPositions ?? 0),
        maxTradesPerDay: Number((plan as any).risk?.maxTradesPerDay ?? 0),
      },
      rules: Array.isArray((plan as any).rules)
        ? (plan as any).rules.map((r: any) => ({
          id: String(r?.id ?? ""),
          title: String(r?.title ?? ""),
          description: String(r?.description ?? ""),
          category:
            r?.category === "Risk" ||
              r?.category === "Exit" ||
              r?.category === "Process" ||
              r?.category === "Psychology"
              ? r.category
              : "Entry",
          severity: r?.severity === "hard" ? "hard" : "soft",
        }))
        : [],
      kpis: {
        adherencePct: Number((plan as any).kpis?.adherencePct ?? 0),
        sessionDisciplinePct7d: Number((plan as any).kpis?.sessionDisciplinePct7d ?? 0),
        avgRiskPerTradePct7d: Number((plan as any).kpis?.avgRiskPerTradePct7d ?? 0),
        journalCompliancePct: Number((plan as any).kpis?.journalCompliancePct ?? 0),
        violations7d: Number((plan as any).kpis?.violations7d ?? 0),
      },
      archivedAt:
        typeof (plan as any).archivedAt === "number"
          ? Number((plan as any).archivedAt)
          : undefined,
      createdAt: Number((plan as any).createdAt ?? 0),
      updatedAt: Number((plan as any).updatedAt ?? 0),
    };
  },
});
