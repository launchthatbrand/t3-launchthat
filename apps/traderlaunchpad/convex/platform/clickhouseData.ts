// ClickHouse browse endpoints must be actions because queries/mutations can't use timers.
// This module is intentionally public (callable by client) but locked down to platform admins.
"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { clickhouseSelect } from "../lib/clickhouseHttp";

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

const throwClickhouse = (res: { error?: string; status?: number; textPreview?: string }) => {
  const status = typeof res.status === "number" ? ` (${res.status})` : "";
  const preview = typeof res.textPreview === "string" && res.textPreview.trim() ? `\n${res.textPreview}` : "";
  throw new Error(`ClickHouse query failed${status}: ${res.error ?? "Unknown error"}${preview}`);
};

export const listSourceKeys = action({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limit = Math.max(1, Math.min(2000, Number(args.limit ?? 500)));
    const res = await clickhouseSelect<{ sourceKey: string }>(
      "SELECT DISTINCT sourceKey FROM candles_1m ORDER BY sourceKey LIMIT {limit:Int64}",
      [{ name: "limit", type: "Int64", value: limit }],
    );
    if (!res.ok) throwClickhouse(res);
    return res.rows.map((r) => String(r.sourceKey ?? "")).filter(Boolean);
  },
});

export const listPairsForSourceKey = action({
  args: {
    sourceKey: v.string(),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({ tradableInstrumentId: v.string(), symbol: v.string() })),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKey = args.sourceKey.trim();
    if (!sourceKey) return [];
    const limit = Math.max(1, Math.min(2000, Number(args.limit ?? 200)));
    const search = typeof args.search === "string" ? args.search.trim().toUpperCase() : "";

    const whereSearch = search ? " AND symbol ILIKE {q:String}" : "";
    const params = [
      { name: "sourceKey", type: "String", value: sourceKey },
      { name: "limit", type: "Int64", value: limit },
      ...(search ? [{ name: "q", type: "String", value: `%${search}%` }] : []),
    ];

    // IMPORTANT: don't alias as "symbol" because ClickHouse may resolve `symbol`
    // in WHERE to the SELECT alias (aggregate), causing ILLEGAL_AGGREGATION.
    const res = await clickhouseSelect<{ tradableInstrumentId: string; symbolAny: string }>(
      `SELECT tradableInstrumentId, any(symbol) AS symbolAny
       FROM candles_1m
       WHERE sourceKey = {sourceKey:String}${whereSearch}
       GROUP BY tradableInstrumentId
       ORDER BY symbolAny
       LIMIT {limit:Int64}`,
      params,
    );
    if (!res.ok) throwClickhouse(res);
    return res.rows
      .map((r) => ({
        tradableInstrumentId: String(r.tradableInstrumentId ?? "").trim(),
        symbol: String(r.symbolAny ?? "").trim(),
      }))
      .filter((r) => r.tradableInstrumentId && r.symbol);
  },
});

export const getCoverageSummary1m = action({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
  },
  returns: v.union(
    v.object({
      minTs: v.optional(v.string()),
      maxTs: v.optional(v.string()),
      rows: v.number(),
      expectedRows: v.number(),
      missingEstimate: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKey = args.sourceKey.trim();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    if (!sourceKey || !tradableInstrumentId) return null;

    const res = await clickhouseSelect<{
      minTs: string;
      maxTs: string;
      rows: number;
      expectedRows: number;
      missingEstimate: number;
    }>(
      `SELECT
         toString(min(ts)) AS minTs,
         toString(max(ts)) AS maxTs,
         count() AS rows,
         dateDiff('minute', min(ts), max(ts)) + 1 AS expectedRows,
         (dateDiff('minute', min(ts), max(ts)) + 1) - count() AS missingEstimate
       FROM candles_1m
       WHERE sourceKey = {sourceKey:String}
         AND tradableInstrumentId = {tradableInstrumentId:String}`,
      [
        { name: "sourceKey", type: "String", value: sourceKey },
        { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
      ],
    );
    if (!res.ok) throwClickhouse(res);
    const row = res.rows[0] as any;
    if (!row) return null;
    const rows = Number(row.rows ?? 0);
    if (!Number.isFinite(rows) || rows <= 0) {
      return {
        minTs: undefined,
        maxTs: undefined,
        rows: 0,
        expectedRows: 0,
        missingEstimate: 0,
      };
    }
    return {
      minTs: typeof row.minTs === "string" ? row.minTs : undefined,
      maxTs: typeof row.maxTs === "string" ? row.maxTs : undefined,
      rows,
      expectedRows: Number(row.expectedRows ?? 0),
      missingEstimate: Number(row.missingEstimate ?? 0),
    };
  },
});

export const compareBrokersForSymbol1m = action({
  args: { symbol: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      sourceKey: v.string(),
      tradableInstrumentId: v.string(),
      minTs: v.optional(v.string()),
      maxTs: v.optional(v.string()),
      rows_24h: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const symbol = args.symbol.trim().toUpperCase();
    if (!symbol) return [];
    const limit = Math.max(1, Math.min(2000, Number(args.limit ?? 200)));

    const res = await clickhouseSelect<{
      sourceKey: string;
      tradableInstrumentId: string;
      minTs: string;
      maxTs: string;
      rows_24h: number;
    }>(
      `SELECT
         sourceKey,
         any(tradableInstrumentId) AS tradableInstrumentId,
         toString(min(ts)) AS minTs,
         toString(max(ts)) AS maxTs,
         countIf(ts >= now() - INTERVAL 1 DAY) AS rows_24h
       FROM candles_1m
       WHERE symbol = {symbol:String}
       GROUP BY sourceKey
       ORDER BY sourceKey
       LIMIT {limit:Int64}`,
      [
        { name: "symbol", type: "String", value: symbol },
        { name: "limit", type: "Int64", value: limit },
      ],
    );
    if (!res.ok) throwClickhouse(res);
    return res.rows.map((r: any) => ({
      sourceKey: String(r.sourceKey ?? ""),
      tradableInstrumentId: String(r.tradableInstrumentId ?? ""),
      minTs: typeof r.minTs === "string" ? r.minTs : undefined,
      maxTs: typeof r.maxTs === "string" ? r.maxTs : undefined,
      rows_24h: Number(r.rows_24h ?? 0),
    }));
  },
});

