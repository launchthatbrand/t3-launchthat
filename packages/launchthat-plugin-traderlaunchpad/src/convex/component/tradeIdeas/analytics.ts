import { v } from "convex/values";

import { query } from "../server";

const toDateKey = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().slice(0, 10);
};

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
    accountId: v.optional(v.string()),
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
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";

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

    const openScoped = accountId
      ? (open as any[]).filter((t: any) => String(t?.accountId ?? "") === accountId)
      : (open as any[]);
    const closedScoped = accountId
      ? (closed as any[]).filter((t: any) => String(t?.accountId ?? "") === accountId)
      : (closed as any[]);

    const pnls = closedScoped
      .map((t: any) => (typeof t.realizedPnl === "number" ? t.realizedPnl : 0))
      .filter((n) => Number.isFinite(n));
    const wins = pnls.filter((n) => n > 0);
    const losses = pnls.filter((n) => n < 0);

    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

    const totalPnl = sum(pnls);
    const totalFees = sum(
      closedScoped.map((t: any) => (typeof t.fees === "number" ? t.fees : 0)),
    );
    const winRate = pnls.length ? wins.length / pnls.length : 0;
    const avgWin = avg(wins);
    const avgLoss = avg(losses); // negative
    const expectancy = avg(pnls);

    return {
      sampleSize: pnls.length,
      closedTrades: closedScoped.length,
      openTrades: openScoped.length,
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
    accountId: v.optional(v.string()),
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
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";

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
      if (accountId && String((t as any)?.accountId ?? "") !== accountId) continue;
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

export const listCalendarDailyStats = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      date: v.string(), // YYYY-MM-DD
      pnl: v.number(), // realized
      wins: v.number(),
      losses: v.number(),
      unrealizedPnl: v.optional(v.number()), // as-of last sync, shown on today only
    }),
  ),
  handler: async (ctx, args) => {
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";
    const daysBack = Math.max(1, Math.min(365, Number(args.daysBack ?? 60)));
    const now = Date.now();
    const fromClosedAt = now - daysBack * 24 * 60 * 60 * 1000;

    const events = accountId
      ? await ctx.db
          .query("tradeRealizationEvents")
          .withIndex("by_org_user_accountId_closedAt", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .eq("accountId", accountId)
              .gte("closedAt", fromClosedAt)
              .lte("closedAt", now),
          )
          .order("asc")
          .take(5000)
      : await ctx.db
          .query("tradeRealizationEvents")
          .withIndex("by_org_user_closedAt", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .gte("closedAt", fromClosedAt)
              .lte("closedAt", now),
          )
          .order("asc")
          .take(5000);

    const byDate: Record<string, { date: string; pnl: number; wins: number; losses: number }> = {};
    for (const e of events as any[]) {
      const closedAt = typeof e.closedAt === "number" ? e.closedAt : 0;
      const pnl = typeof e.realizedPnl === "number" ? e.realizedPnl : 0;
      if (!closedAt || !Number.isFinite(closedAt)) continue;
      const date = toDateKey(closedAt);
      const row = byDate[date] ?? (byDate[date] = { date, pnl: 0, wins: 0, losses: 0 });
      row.pnl += Number.isFinite(pnl) ? pnl : 0;
      if (pnl >= 0) row.wins += 1;
      else row.losses += 1;
    }

    // Unrealized (as-of last sync): sum current open positions unrealized and attach to today's date.
    const positions = await ctx.db
      .query("tradePositions")
      .withIndex("by_org_user_openedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(1000);
    const unrealizedTotal = (positions as any[]).reduce((acc, p) => {
      const v = typeof p.unrealizedPnl === "number" ? p.unrealizedPnl : 0;
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);

    const todayKey = toDateKey(now);
    const base = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    if (Number.isFinite(unrealizedTotal) && unrealizedTotal !== 0) {
      const existing = byDate[todayKey];
      if (existing) {
        return base.map((r) =>
          r.date === todayKey ? { ...r, unrealizedPnl: unrealizedTotal } : r,
        );
      }
      return [
        ...base,
        { date: todayKey, pnl: 0, wins: 0, losses: 0, unrealizedPnl: unrealizedTotal },
      ].sort((a, b) => a.date.localeCompare(b.date));
    }
    return base;
  },
});

export const listCalendarRealizationEvents = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.optional(v.string()),
    daysBack: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalEventId: v.string(),
      tradeIdeaGroupId: v.optional(v.id("tradeIdeaGroups")),
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
    const accountId = typeof args.accountId === "string" ? args.accountId.trim() : "";
    const daysBack = Math.max(1, Math.min(365, Number(args.daysBack ?? 60)));
    const now = Date.now();
    const fromClosedAt = now - daysBack * 24 * 60 * 60 * 1000;

    const rows = accountId
      ? await ctx.db
          .query("tradeRealizationEvents")
          .withIndex("by_org_user_accountId_closedAt", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .eq("accountId", accountId)
              .gte("closedAt", fromClosedAt)
              .lte("closedAt", now),
          )
          .order("desc")
          .take(2000)
      : await ctx.db
          .query("tradeRealizationEvents")
          .withIndex("by_org_user_closedAt", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .gte("closedAt", fromClosedAt)
              .lte("closedAt", now),
          )
          .order("desc")
          .take(2000);

    const groupIds = Array.from(
      new Set(
        (rows as any[])
          .map((r) => r.tradeIdeaGroupId)
          .filter((id): id is string => typeof id === "string" && Boolean(id)),
      ),
    );

    const groupById = new Map<string, { symbol: string; direction: "long" | "short" }>();
    for (const id of groupIds) {
      const g = await ctx.db.get(id as any);
      const symbol = typeof (g as any)?.symbol === "string" ? (g as any).symbol : "";
      const direction =
        (g as any)?.direction === "short"
          ? "short"
          : (g as any)?.direction === "long"
            ? "long"
            : null;
      if (symbol && direction) {
        groupById.set(id, { symbol, direction });
      }
    }

    return (rows as any[]).map((r) => {
      const gid = typeof r.tradeIdeaGroupId === "string" ? r.tradeIdeaGroupId : null;
      const meta = gid ? groupById.get(gid) : undefined;
      return {
        externalEventId: String(r.externalEventId ?? ""),
        tradeIdeaGroupId: gid ? (gid as any) : undefined,
        externalPositionId: String(r.externalPositionId ?? ""),
        externalOrderId: typeof r.externalOrderId === "string" ? r.externalOrderId : undefined,
        symbol: meta?.symbol ?? null,
        direction: meta?.direction ?? null,
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
      };
    });
  },
});

export const listTradeIdeaRealizationEvents = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalEventId: v.string(),
      tradeIdeaGroupId: v.optional(v.id("tradeIdeaGroups")),
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
    const limit = Math.max(1, Math.min(5000, Number(args.limit ?? 2000)));

    const rows = await ctx.db
      .query("tradeRealizationEvents")
      .withIndex("by_org_user_tradeIdeaGroupId_closedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("tradeIdeaGroupId", args.tradeIdeaGroupId)
          .lte("closedAt", Date.now()),
      )
      .order("desc")
      .take(limit);

    return (rows as any[]).map((r) => ({
      externalEventId: String(r.externalEventId ?? ""),
      tradeIdeaGroupId:
        typeof r.tradeIdeaGroupId === "string" ? (r.tradeIdeaGroupId as any) : undefined,
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

export const listPositionRealizationEvents = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.string(),
    positionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalEventId: v.string(),
      tradeIdeaGroupId: v.optional(v.id("tradeIdeaGroups")),
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
    const accountId = String(args.accountId ?? "").trim();
    const positionId = String(args.positionId ?? "").trim();
    if (!accountId || !positionId) return [];

    const limit = Math.max(1, Math.min(5000, Number(args.limit ?? 2000)));

    const rows = await ctx.db
      .query("tradeRealizationEvents")
      .withIndex("by_org_user_accountId_externalPositionId_closedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", accountId)
          .eq("externalPositionId", positionId)
          .lte("closedAt", Date.now()),
      )
      .order("desc")
      .take(limit);

    return (rows as any[]).map((r) => ({
      externalEventId: String(r.externalEventId ?? ""),
      tradeIdeaGroupId:
        typeof r.tradeIdeaGroupId === "string" ? (r.tradeIdeaGroupId as any) : undefined,
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
