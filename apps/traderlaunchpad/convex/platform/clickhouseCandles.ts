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

/**
 * Read candles directly from ClickHouse for chart rendering.
 * Returns bars sorted ascending by time (ms).
 */
export const listCandles1m = action({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.optional(
      v.union(
        v.literal("1m"),
        v.literal("5m"),
        v.literal("15m"),
        v.literal("30m"),
        v.literal("1h"),
        v.literal("4h"),
        v.literal("1d"),
      ),
    ),
    // Optional time window (ms)
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    // Limit applies to returned bars (best-effort)
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      t: v.number(),
      o: v.number(),
      h: v.number(),
      l: v.number(),
      c: v.number(),
      v: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    if (!sourceKey || !tradableInstrumentId) return [];

    const resolution = args.resolution ?? "1m";
    const table =
      resolution === "1m"
        ? "candles_1m"
        : resolution === "5m"
          ? "candles_5m"
          : resolution === "15m"
            ? "candles_15m"
            : resolution === "30m"
              ? "candles_30m"
              : resolution === "1h"
                ? "candles_1h"
                : resolution === "4h"
                  ? "candles_4h"
                  : "candles_1d";

    const limit = Math.max(50, Math.min(10_000, Number(args.limit ?? 1500)));
    const fromMs =
      typeof args.fromMs === "number" && Number.isFinite(args.fromMs) ? args.fromMs : null;
    const toMs =
      typeof args.toMs === "number" && Number.isFinite(args.toMs) ? args.toMs : null;

    const whereFrom = fromMs !== null ? " AND ts >= fromUnixTimestamp64Milli({fromMs:Int64})" : "";
    const whereTo = toMs !== null ? " AND ts <= fromUnixTimestamp64Milli({toMs:Int64})" : "";

    const params: any[] = [
      { name: "sourceKey", type: "String", value: sourceKey },
      { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
      { name: "limit", type: "Int64", value: limit },
    ];
    if (fromMs !== null) params.push({ name: "fromMs", type: "Int64", value: Math.floor(fromMs) });
    if (toMs !== null) params.push({ name: "toMs", type: "Int64", value: Math.floor(toMs) });

    // Query newest first for efficiency, then reverse for chart.
    const res = await clickhouseSelect<{
      t: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    }>(
      `SELECT
         toUnixTimestamp64Milli(ts) AS t,
         open AS o,
         high AS h,
         low AS l,
         close AS c,
         volume AS v
       FROM ${table}
       WHERE sourceKey = {sourceKey:String}
         AND tradableInstrumentId = {tradableInstrumentId:String}
         ${whereFrom}
         ${whereTo}
       ORDER BY ts DESC
       LIMIT {limit:Int64}`,
      params,
      { timeoutMs: 60_000 },
    );

    if (!res.ok) throw new Error(res.error ?? "ClickHouse query failed");

    const bars = res.rows
      .map((r) => ({
        t: Number(r.t),
        o: Number(r.o),
        h: Number(r.h),
        l: Number(r.l),
        c: Number(r.c),
        v: Number.isFinite(Number(r.v)) ? Number(r.v) : undefined,
      }))
      .filter((b) => Number.isFinite(b.t) && Number.isFinite(b.o) && Number.isFinite(b.h) && Number.isFinite(b.l) && Number.isFinite(b.c))
      .sort((a, b) => a.t - b.t);

    return bars;
  },
});

