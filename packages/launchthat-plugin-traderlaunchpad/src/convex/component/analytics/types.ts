import { v } from "convex/values";

export const analyticsReportFilterSpecV1Validator = v.object({
  version: v.literal(1),

  // Time range
  rangePreset: v.union(
    v.literal("7d"),
    v.literal("30d"),
    v.literal("90d"),
    v.literal("ytd"),
    v.literal("all"),
    v.literal("custom"),
  ),
  fromMs: v.optional(v.number()),
  toMs: v.optional(v.number()),

  // Bucketing/filters that depend on local time.
  timezone: v.string(),

  // Filters
  weekdays: v.optional(v.array(v.number())), // 0..6 (validated at runtime)
  symbols: v.optional(v.array(v.string())),
  direction: v.optional(v.array(v.union(v.literal("long"), v.literal("short")))),
  minHoldMs: v.optional(v.number()),
  maxHoldMs: v.optional(v.number()),
  minPnl: v.optional(v.number()),
  maxPnl: v.optional(v.number()),

  includeUnrealized: v.optional(v.boolean()),
});

export type AnalyticsReportFilterSpecV1 = {
  version: 1;
  rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
  fromMs?: number;
  toMs?: number;
  timezone: string;
  weekdays?: number[];
  symbols?: string[];
  direction?: Array<"long" | "short">;
  minHoldMs?: number;
  maxHoldMs?: number;
  minPnl?: number;
  maxPnl?: number;
  includeUnrealized?: boolean;
};

export const analyticsReportSpecValidator = analyticsReportFilterSpecV1Validator;

export const analyticsReportResultValidator = v.object({
  // Echo back for UI/debugging
  timezone: v.string(),
  fromMs: v.number(),
  toMs: v.number(),
  isTruncated: v.boolean(),

  headline: v.object({
    tradeCount: v.number(),
    closeEventCount: v.number(),

    realizedPnl: v.number(),
    unrealizedPnl: v.number(),
    netPnl: v.number(),

    totalFees: v.number(),
    grossWin: v.number(),
    grossLoss: v.number(), // negative number
    profitFactor: v.number(), // grossWin / abs(grossLoss)

    wins: v.number(),
    losses: v.number(),
    winRate: v.number(), // 0..1

    avgWin: v.number(),
    avgLoss: v.number(), // negative
    expectancy: v.number(),

    avgHoldMs: v.number(),
  }),

  byWeekday: v.array(
    v.object({
      weekday: v.number(), // 0..6
      closeEventCount: v.number(),
      pnl: v.number(),
    }),
  ),

  byHour: v.array(
    v.object({
      hour: v.number(), // 0..23
      closeEventCount: v.number(),
      pnl: v.number(),
    }),
  ),

  bySymbol: v.array(
    v.object({
      symbol: v.string(),
      closeEventCount: v.number(),
      pnl: v.number(),
    }),
  ),

  equityCurve: v.array(
    v.object({
      date: v.string(), // YYYY-MM-DD in report timezone
      pnl: v.number(), // realized pnl for date
      cumulative: v.number(),
    }),
  ),

  drawdown: v.array(
    v.object({
      date: v.string(),
      equity: v.number(),
      peak: v.number(),
      drawdown: v.number(), // negative or 0
    }),
  ),
});

