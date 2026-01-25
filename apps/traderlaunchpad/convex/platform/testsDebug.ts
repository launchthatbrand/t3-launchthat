"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { env } from "../../src/env";

const internal: any = require("../_generated/api").internal;
const components: any = require("../_generated/api").components;

const normalizeSymbol = (s: string): string => s.trim().toUpperCase();

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

    const results: Array<{
      organizationId: string;
      total: number;
      open: number;
      closed: number;
      sample: Array<{
        userId: string;
        status: string;
        direction: string;
        openedAt: number;
        avgEntryPrice?: number;
        netQty?: number;
      }>;
    }> = [];

    for (const organizationId of orgIds) {
      const openRows = (await ctx.runQuery(
        components.launchthat_traderlaunchpad.tradeIdeas.queries.listOpenGroupsForOrgSymbol,
        { organizationId, symbol, limit },
      )) as any[] | null;

      // If you have no open groups, preview positions will be empty.
      const openList = Array.isArray(openRows) ? openRows : [];
      results.push({
        organizationId,
        total: openList.length,
        open: openList.length,
        closed: 0,
        sample: openList.slice(0, 10).map((r: any) => ({
          userId: typeof r?.userId === "string" ? r.userId : "",
          status: "open",
          direction: typeof r?.direction === "string" ? r.direction : "",
          openedAt: typeof r?.openedAt === "number" ? r.openedAt : 0,
          avgEntryPrice: typeof r?.avgEntryPrice === "number" ? r.avgEntryPrice : undefined,
          netQty: typeof r?.netQty === "number" ? r.netQty : undefined,
        })),
      });
    }

    return { ok: true, symbol, orgs: results };
  },
});

