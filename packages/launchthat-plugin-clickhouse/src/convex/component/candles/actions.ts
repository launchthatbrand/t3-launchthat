/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { action } from "../server";
import {
  clickhouseExec,
  clickhouseSelect,
  type ClickhouseHttpConfig,
  type ClickhouseParam,
} from "../lib/clickhouseHttp";

export type CandleResolution = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

const clickhouseConfigValidator = v.object({
  url: v.string(),
  database: v.optional(v.string()),
  user: v.string(),
  password: v.string(),
});

const toTable = (resolution: CandleResolution): string => {
  switch (resolution) {
    case "1m":
      return "candles_1m";
    case "5m":
      return "candles_5m";
    case "15m":
      return "candles_15m";
    case "30m":
      return "candles_30m";
    case "1h":
      return "candles_1h";
    case "4h":
      return "candles_4h";
    case "1d":
      return "candles_1d";
  }
};

export const listCandles = action({
  args: {
    clickhouse: clickhouseConfigValidator,
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
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
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
  handler: async (_ctx, args) => {
    const clickhouse = args.clickhouse as unknown as ClickhouseHttpConfig;
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    if (!sourceKey || !tradableInstrumentId) return [];

    const resolution = (args.resolution ?? "1m") as CandleResolution;
    const table = toTable(resolution);

    const limit = Math.max(50, Math.min(10_000, Number(args.limit ?? 1500)));
    const fromMs =
      typeof args.fromMs === "number" && Number.isFinite(args.fromMs) ? args.fromMs : null;
    const toMs = typeof args.toMs === "number" && Number.isFinite(args.toMs) ? args.toMs : null;

    const whereFrom =
      fromMs !== null ? " AND ts >= fromUnixTimestamp64Milli({fromMs:Int64})" : "";
    const whereTo = toMs !== null ? " AND ts <= fromUnixTimestamp64Milli({toMs:Int64})" : "";

    const params: ClickhouseParam[] = [
      { name: "sourceKey", type: "String", value: sourceKey },
      { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
      { name: "limit", type: "Int64", value: limit },
    ];
    if (fromMs !== null) params.push({ name: "fromMs", type: "Int64", value: Math.floor(fromMs) });
    if (toMs !== null) params.push({ name: "toMs", type: "Int64", value: Math.floor(toMs) });

    const res = await clickhouseSelect<{
      t: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
    }>(
      clickhouse,
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

    return res.rows
      .map((r) => ({
        t: Number(r.t),
        o: Number(r.o),
        h: Number(r.h),
        l: Number(r.l),
        c: Number(r.c),
        v: Number.isFinite(Number(r.v)) ? Number(r.v) : undefined,
      }))
      .filter(
        (b) =>
          Number.isFinite(b.t) &&
          Number.isFinite(b.o) &&
          Number.isFinite(b.h) &&
          Number.isFinite(b.l) &&
          Number.isFinite(b.c),
      )
      .sort((a, b) => a.t - b.t);
  },
});

export const getMaxTsMs1m = action({
  args: {
    clickhouse: clickhouseConfigValidator,
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
  },
  returns: v.union(v.null(), v.number()),
  handler: async (_ctx, args) => {
    const clickhouse = args.clickhouse as unknown as ClickhouseHttpConfig;
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    if (!sourceKey || !tradableInstrumentId) return null;

    const res = await clickhouseSelect<{ maxTsMs: number }>(
      clickhouse,
      `SELECT toUnixTimestamp64Milli(max(ts)) AS maxTsMs
       FROM candles_1m
       WHERE sourceKey = {sourceKey:String}
         AND tradableInstrumentId = {tradableInstrumentId:String}`,
      [
        { name: "sourceKey", type: "String", value: sourceKey },
        { name: "tradableInstrumentId", type: "String", value: tradableInstrumentId },
      ],
      { timeoutMs: 30_000 },
    );
    if (!res.ok) throw new Error(res.error ?? "ClickHouse max(ts) query failed");
    const v0 = Number(res.rows[0]?.maxTsMs ?? NaN);
    return Number.isFinite(v0) ? v0 : null;
  },
});

export const insertCandles1mJsonEachRow = action({
  args: {
    clickhouse: clickhouseConfigValidator,
    // JSONEachRow payload (each line is a JSON object) inserted into candles_1m
    payload: v.string(),
  },
  returns: v.object({ ok: v.boolean(), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    const clickhouse = args.clickhouse as unknown as ClickhouseHttpConfig;
    const payload = args.payload.trim();
    if (!payload) return { ok: true };
    const sql = `INSERT INTO candles_1m FORMAT JSONEachRow\n${payload}`;
    const res = await clickhouseExec(clickhouse, sql, [], { timeoutMs: 120_000 });
    if (!res.ok) return { ok: false, error: res.error ?? "ClickHouse insert failed" };
    return { ok: true };
  },
});

