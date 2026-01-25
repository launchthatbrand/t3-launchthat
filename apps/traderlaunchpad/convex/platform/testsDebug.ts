"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { env } from "../../src/env";
import { clusterCommunityPositions } from "launchthat-plugin-traderlaunchpad/runtime/discordSnapshot";
import type { CommunityPosition } from "launchthat-plugin-traderlaunchpad/runtime/discordSnapshot";

const internal: any = require("../_generated/api").internal;
const components: any = require("../_generated/api").components;

const normalizeSymbol = (s: string): string => s.trim().toUpperCase();

interface OrgAggregationDebugRow {
  organizationId: string;
  usersScanned: number;
  usersAllowed: number;
  openPositions: number;
  clusters: number;
  sampleAllowedUserIds: string[];
}

const getOrgAggregationNoAuth = async (
  ctx: any,
  args: { organizationId: string; symbol: string; maxUsers: number },
): Promise<OrgAggregationDebugRow> => {
  const organizationId = args.organizationId.trim();
  const symbol = normalizeSymbol(args.symbol);
  const maxUsers = Math.max(1, Math.min(500, Number(args.maxUsers)));

  if (!organizationId || !symbol) {
    return {
      organizationId,
      usersScanned: 0,
      usersAllowed: 0,
      openPositions: 0,
      clusters: 0,
      sampleAllowedUserIds: [],
    };
  }

  const members = await ctx.runQuery(
    components.launchthat_core_tenant.queries.listMembersByOrganizationId,
    { organizationId },
  );

  const memberList = Array.isArray(members) ? members : [];
  const memberUserIds = memberList
    .map((m: any) => ({
      userId: String(m?.userId ?? m?.member?.userId ?? ""),
      isActive: Boolean(m?.isActive),
    }))
    .filter((m) => m.userId && m.isActive)
    .map((m) => m.userId);

  const userIds = memberUserIds.slice(0, maxUsers);

  const permsRows = await ctx.runQuery(
    components.launchthat_traderlaunchpad.permissions.listOrgPermissionsForUsers,
    { organizationId, userIds },
  );

  const permsList = Array.isArray(permsRows) ? permsRows : [];
  const allowedUserIds = permsList
    .filter((r: any) => Boolean(r?.globalEnabled) || Boolean(r?.openPositionsEnabled))
    .map((r: any) => String(r?.userId ?? ""))
    .filter(Boolean);

  const positions: CommunityPosition[] = [];
  for (const userId of allowedUserIds) {
    const groups = await ctx.runQuery(
      components.launchthat_traderlaunchpad.tradeIdeas.queries.listLatestForSymbol,
      { userId, symbol, status: "open", limit: 200 },
    );

    const groupList = Array.isArray(groups) ? groups : [];
    for (const g of groupList) {
      if (String(g?.status ?? "") !== "open") continue;
      positions.push({
        userId,
        direction: g?.direction === "short" ? "short" : "long",
        netQty: typeof g?.netQty === "number" ? g.netQty : 0,
        avgEntryPrice:
          typeof g?.avgEntryPrice === "number" ? g.avgEntryPrice : undefined,
        openedAt: typeof g?.openedAt === "number" ? g.openedAt : 0,
      });
    }
  }

  const clusters = clusterCommunityPositions({ positions, maxClusters: 10 });

  return {
    organizationId,
    usersScanned: userIds.length,
    usersAllowed: allowedUserIds.length,
    openPositions: positions.length,
    clusters: clusters.length,
    sampleAllowedUserIds: allowedUserIds.slice(0, 10),
  };
};

export const inspectPriceBarChunksForSymbol = action({
  args: {
    symbol: v.string(),
    resolution: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Allow running from CLI without an auth identity in dev/test.
    if (env.NODE_ENV === "production") {
      await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
    }

    const symbol = normalizeSymbol(args.symbol);
    const resolution = typeof args.resolution === "string" ? args.resolution : "15m";
    const limit = Math.max(1, Math.min(50, Number(args.limit ?? 10)));

    const source = await ctx.runQuery(
      components.launchthat_pricedata.sources.queries.getDefaultSource,
      {},
    );
    const sourceKey = typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) return { ok: false, error: "No default pricedata sourceKey" };

    const instrument = await ctx.runQuery(
      components.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
      { sourceKey, symbol },
    );
    const tradableInstrumentId =
      typeof instrument?.tradableInstrumentId === "string"
        ? String(instrument.tradableInstrumentId)
        : "";
    if (!tradableInstrumentId) {
      return {
        ok: false,
        error: "No instrument found for symbol on default source",
        sourceKey,
        symbol,
      };
    }

    const rows = await ctx.runQuery(
      components.launchthat_pricedata.bars.internalQueries.debugListBarChunks,
      { sourceKey, tradableInstrumentId, resolution, limit },
    );

    const list = Array.isArray(rows) ? rows : [];
    return {
      ok: true,
      sourceKey,
      symbol,
      tradableInstrumentId,
      resolution,
      rows: list.map((r: any) => ({
        _id: String(r?._id ?? ""),
        chunkStartMs: Number(r?.chunkStartMs ?? 0),
        chunkEndMs: Number(r?.chunkEndMs ?? 0),
        bars: Array.isArray(r?.bars) ? r.bars.length : 0,
        firstBarT: Array.isArray(r?.bars) ? Number(r.bars[0]?.t ?? 0) : 0,
        lastBarT: Array.isArray(r?.bars) ? Number(r.bars[r.bars.length - 1]?.t ?? 0) : 0,
      })),
    };
  },
});

export const inspectTradeIdeaGroupsForSymbol = action({
  args: {
    symbol: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Allow running from CLI without an auth identity in dev/test.
    if (env.NODE_ENV === "production") {
      await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
    }

    const symbol = normalizeSymbol(args.symbol);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));

    const orgRows = (await ctx.runQuery(
      components.launchthat_core_tenant.queries.listOrganizationsPublic,
      { includePlatform: true, limit: 500 },
    )) as any[] | null;
    const orgIds = (Array.isArray(orgRows) ? orgRows : [])
      .map((o) => (typeof o?._id === "string" ? o._id.trim() : ""))
      .filter(Boolean);

    const results: OrgAggregationDebugRow[] = [];
    for (const organizationId of orgIds) {
      results.push(await getOrgAggregationNoAuth(ctx, { organizationId, symbol, maxUsers: limit }));
    }

    return { ok: true, symbol, orgs: results };
  },
});

export const inspectOrgOpenPositionsForSymbol = action({
  args: {
    organizationId: v.string(),
    symbol: v.string(),
    maxUsers: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Allow running from CLI without an auth identity in dev/test.
    if (env.NODE_ENV === "production") {
      await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
    }

    const organizationId = String(args.organizationId).trim();
    const symbol = normalizeSymbol(args.symbol);
    const maxUsers = Math.max(1, Math.min(500, Number(args.maxUsers ?? 200)));

    const res = await getOrgAggregationNoAuth(ctx, { organizationId, symbol, maxUsers });
    return { ok: true, ...res };
  },
});

export const inspectUserOpenTradeIdeaSymbols = action({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Allow running from CLI without an auth identity in dev/test.
    if (env.NODE_ENV === "production") {
      await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
    }

    const userId = String(args.userId).trim();
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    if (!userId) return { ok: false, error: "Missing userId" };

    const pageRes = await ctx.runQuery(
      components.launchthat_traderlaunchpad.tradeIdeas.queries.listByStatus,
      {
        userId,
        status: "open",
        paginationOpts: { numItems: limit, cursor: null },
      },
    );

    const page = Array.isArray(pageRes?.page) ? pageRes.page : [];
    const bySymbol: Record<string, number> = {};
    for (const g of page as any[]) {
      const sym = normalizeSymbol(String(g?.symbol ?? ""));
      if (!sym) continue;
      bySymbol[sym] = (bySymbol[sym] ?? 0) + 1;
    }

    const symbols = Object.entries(bySymbol)
      .sort((a, b) => b[1] - a[1])
      .map(([symbol, count]) => ({ symbol, count }));

    return {
      ok: true,
      userId,
      scanned: page.length,
      symbols,
      sample: page.slice(0, 5).map((g: any) => ({
        tradeIdeaGroupId: String(g?._id ?? ""),
        symbol: String(g?.symbol ?? ""),
        direction: String(g?.direction ?? ""),
        openedAt: Number(g?.openedAt ?? 0),
        avgEntryPrice: typeof g?.avgEntryPrice === "number" ? g.avgEntryPrice : null,
        netQty: typeof g?.netQty === "number" ? g.netQty : null,
      })),
    };
  },
});

