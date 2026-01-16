import { v } from "convex/values";

import { query } from "../server";

const tradeIdeaView = v.object({
  _id: v.id("tradeIdeaGroups"),
  _creationTime: v.number(),
  organizationId: v.string(),
  userId: v.string(),
  connectionId: v.id("tradelockerConnections"),
  accountId: v.string(),
  positionId: v.optional(v.string()),
  instrumentId: v.optional(v.string()),
  symbol: v.string(),
  status: v.union(v.literal("open"), v.literal("closed")),
  direction: v.union(v.literal("long"), v.literal("short")),
  openedAt: v.number(),
  closedAt: v.optional(v.number()),
  netQty: v.number(),
  avgEntryPrice: v.optional(v.number()),
  realizedPnl: v.optional(v.number()),
  fees: v.optional(v.number()),
  lastExecutionAt: v.optional(v.number()),
  lastProcessedExecutionId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getSummary = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    // Phase 1: consider only last N closed trades for performance.
    limit: v.optional(v.number()),
  },
  returns: v.object({
    sampleSize: v.number(),
    closedTrades: v.number(),
    openTrades: v.number(),
    winRate: v.number(), // 0..1
    avgWin: v.number(),
    avgLoss: v.number(),
    expectancy: v.number(),
    totalFees: v.number(),
    totalPnl: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.max(10, Math.min(500, args.limit ?? 200));

    const open = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", "open"),
      )
      .order("desc")
      .take(200);

    const closed = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", "closed"),
      )
      .order("desc")
      .take(limit);

    const pnls = closed
      .map((t: any) => (typeof t.realizedPnl === "number" ? t.realizedPnl : 0))
      .filter((n) => Number.isFinite(n));
    const wins = pnls.filter((n) => n > 0);
    const losses = pnls.filter((n) => n < 0);

    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

    const totalPnl = sum(pnls);
    const totalFees = sum(
      closed.map((t: any) => (typeof t.fees === "number" ? t.fees : 0)),
    );
    const winRate = pnls.length ? wins.length / pnls.length : 0;
    const avgWin = avg(wins);
    const avgLoss = avg(losses); // negative
    const expectancy = avg(pnls);

    return {
      sampleSize: pnls.length,
      closedTrades: closed.length,
      openTrades: open.length,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
      totalFees,
      totalPnl,
    };
  },
});

export const listByInstrument = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
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
    const limit = Math.max(5, Math.min(100, args.limit ?? 20));

    // Pull a reasonable slice of closed tradeIdeas and aggregate client-side.
    const closed = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", "closed"),
      )
      .order("desc")
      .take(500);

    const buckets = new Map<
      string,
      {
        instrumentId: string;
        symbol: string;
        pnls: number[];
        lastOpenedAt: number;
      }
    >();

    for (const t of closed as any[]) {
      const instrumentId =
        typeof t.instrumentId === "string" && t.instrumentId.trim()
          ? t.instrumentId.trim()
          : null;
      if (!instrumentId) continue;
      const symbol = typeof t.symbol === "string" ? t.symbol : "UNKNOWN";
      const pnl = typeof t.realizedPnl === "number" ? t.realizedPnl : 0;
      const openedAt = typeof t.openedAt === "number" ? t.openedAt : 0;

      const b =
        buckets.get(instrumentId) ??
        (() => {
          const v: {
            instrumentId: string;
            symbol: string;
            pnls: Array<number>;
            lastOpenedAt: number;
          } = { instrumentId, symbol, pnls: [], lastOpenedAt: 0 };
          buckets.set(instrumentId, v);
          return v;
        })();

      b.symbol = symbol;
      b.pnls.push(Number.isFinite(pnl) ? pnl : 0);
      if (openedAt > b.lastOpenedAt) b.lastOpenedAt = openedAt;
    }

    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

    const rows = Array.from(buckets.values())
      .map((b) => {
        const trades = b.pnls.length;
        const wins = b.pnls.filter((n) => n > 0).length;
        const totalPnl = sum(b.pnls);
        const avgPnl = trades ? totalPnl / trades : 0;
        const winRate = trades ? wins / trades : 0;
        return {
          instrumentId: b.instrumentId,
          symbol: b.symbol,
          trades,
          winRate,
          totalPnl,
          avgPnl,
          lastOpenedAt: b.lastOpenedAt,
        };
      })
      .sort((a, b) => b.trades - a.trades)
      .slice(0, limit);

    return rows;
  },
});
