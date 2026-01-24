import { query } from "../server";
import { v } from "convex/values";

import { analyticsReportResultValidator, analyticsReportSpecValidator } from "./types";

type UnknownRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const normalizeVisibility = (v: unknown): "private" | "link" => (v === "link" ? "link" : "private");

const getRangeMs = (
  now: number,
  spec: { rangePreset: string; fromMs?: number; toMs?: number },
): { fromMs: number; toMs: number } => {
  const toMs = typeof spec.toMs === "number" && Number.isFinite(spec.toMs) ? spec.toMs : now;
  if (spec.rangePreset === "custom") {
    const fromMs =
      typeof spec.fromMs === "number" && Number.isFinite(spec.fromMs)
        ? spec.fromMs
        : toMs - 30 * 24 * 60 * 60 * 1000;
    return { fromMs, toMs };
  }
  if (spec.rangePreset === "7d") return { fromMs: toMs - 7 * 24 * 60 * 60 * 1000, toMs };
  if (spec.rangePreset === "30d") return { fromMs: toMs - 30 * 24 * 60 * 60 * 1000, toMs };
  if (spec.rangePreset === "90d") return { fromMs: toMs - 90 * 24 * 60 * 60 * 1000, toMs };
  if (spec.rangePreset === "ytd") {
    const d = new Date(toMs);
    const start = Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    return { fromMs: start, toMs };
  }
  if (spec.rangePreset === "all") return { fromMs: 0, toMs };
  // default
  return { fromMs: toMs - 30 * 24 * 60 * 60 * 1000, toMs };
};

const toLocalParts = (
  tsMs: number,
  timeZone: string,
): { weekday: number; hour: number; dateKey: string } => {
  // Use formatToParts so it works across locales.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });

  const parts = fmt.formatToParts(new Date(tsMs));
  const byType: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") byType[p.type] = p.value;
  }

  const wd = String(byType.weekday ?? "");
  const weekday =
    wd === "Sun"
      ? 0
      : wd === "Mon"
        ? 1
        : wd === "Tue"
          ? 2
          : wd === "Wed"
            ? 3
            : wd === "Thu"
              ? 4
              : wd === "Fri"
                ? 5
                : wd === "Sat"
                  ? 6
                  : 0;

  const hour = clamp(Number(byType.hour ?? 0), 0, 23);
  const y = String(byType.year ?? "1970");
  const m = String(byType.month ?? "01");
  const d = String(byType.day ?? "01");
  const dateKey = `${y}-${m}-${d}`;
  return { weekday, hour, dateKey };
};

const computeAnalyticsReport = async (
  ctx: any,
  input: {
    organizationId: string;
    userId: string;
    accountId?: string;
    spec: any;
  },
) => {
  let timeZone = String(input.spec.timezone ?? "UTC") || "UTC";
  try {
    // Validate timezone string for Intl.
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
  } catch {
    timeZone = "UTC";
  }
  const now = Date.now();
  const { fromMs, toMs } = getRangeMs(now, input.spec);

  const accountId = typeof input.accountId === "string" ? input.accountId.trim() : "";

  const limit = 5000;
  const rows = accountId
    ? await ctx.db
        .query("tradeRealizationEvents")
        .withIndex("by_org_user_accountId_closedAt", (q: any) =>
          q
            .eq("organizationId", input.organizationId)
            .eq("userId", input.userId)
            .eq("accountId", accountId)
            .gte("closedAt", fromMs)
            .lte("closedAt", toMs),
        )
        .order("asc")
        .take(limit)
    : await ctx.db
        .query("tradeRealizationEvents")
        .withIndex("by_org_user_closedAt", (q: any) =>
          q
            .eq("organizationId", input.organizationId)
            .eq("userId", input.userId)
            .gte("closedAt", fromMs)
            .lte("closedAt", toMs),
        )
        .order("asc")
        .take(limit);

  const isTruncated = (rows as any[]).length >= limit;

  // Preload tradeIdeaGroups for symbol/direction where possible.
  const groupIds = Array.from(
    new Set(
      (rows as any[])
        .map((r) =>
          typeof (r as any).tradeIdeaGroupId === "string" ? (r as any).tradeIdeaGroupId : null,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const groupById = new Map<string, { symbol: string; direction: "long" | "short" }>();
  for (const id of groupIds) {
    const g = await ctx.db.get(id as any);
    const symbol = typeof (g as any)?.symbol === "string" ? String((g as any).symbol) : "";
    const direction =
      (g as any)?.direction === "short"
        ? "short"
        : (g as any)?.direction === "long"
          ? "long"
          : null;
    if (symbol && direction) groupById.set(id, { symbol, direction });
  }

  const weekdaysFilter =
    Array.isArray(input.spec.weekdays) && input.spec.weekdays.length > 0
      ? input.spec.weekdays.map((n: any) => clamp(Number(n), 0, 6))
      : null;
  const weekdaysSet =
    weekdaysFilter && weekdaysFilter.length > 0 ? new Set<number>(weekdaysFilter) : null;

  const symbolsFilter =
    Array.isArray(input.spec.symbols) && input.spec.symbols.length > 0
      ? input.spec.symbols.map((s: any) => String(s).trim().toUpperCase()).filter(Boolean)
      : null;
  const symbolsSet = symbolsFilter && symbolsFilter.length > 0 ? new Set<string>(symbolsFilter) : null;

  const directionFilter =
    Array.isArray(input.spec.direction) && input.spec.direction.length > 0 ? input.spec.direction : null;
  const directionSet = directionFilter && directionFilter.length > 0 ? new Set(directionFilter) : null;

  const minHoldMs = typeof input.spec.minHoldMs === "number" ? input.spec.minHoldMs : undefined;
  const maxHoldMs = typeof input.spec.maxHoldMs === "number" ? input.spec.maxHoldMs : undefined;
  const minPnl = typeof input.spec.minPnl === "number" ? input.spec.minPnl : undefined;
  const maxPnl = typeof input.spec.maxPnl === "number" ? input.spec.maxPnl : undefined;

  const byWeekday: Record<number, { weekday: number; closeEventCount: number; pnl: number }> = {};
  const byHour: Record<number, { hour: number; closeEventCount: number; pnl: number }> = {};
  const bySymbol: Record<string, { symbol: string; closeEventCount: number; pnl: number }> = {};
  const byDate: Record<string, { date: string; pnl: number }> = {};

  let closeEventCount = 0;
  let realizedPnl = 0;
  let totalFees = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let holdSum = 0;
  let holdCount = 0;

  // tradeCount is defined at trade-idea-group level (best-effort). Fallback to unique externalPositionId.
  const uniqueTradeIds = new Set<string>();

  for (const r of rows as any[]) {
    const closedAt = typeof r.closedAt === "number" ? r.closedAt : 0;
    if (!closedAt || !Number.isFinite(closedAt)) continue;

    const { weekday, hour, dateKey } = toLocalParts(closedAt, timeZone);
    if (weekdaysSet && !weekdaysSet.has(weekday)) continue;

    const pnl = typeof r.realizedPnl === "number" ? r.realizedPnl : 0;
    if (typeof minPnl === "number" && pnl < minPnl) continue;
    if (typeof maxPnl === "number" && pnl > maxPnl) continue;

    const gid = typeof r.tradeIdeaGroupId === "string" ? r.tradeIdeaGroupId : "";
    const meta = gid ? groupById.get(gid) : undefined;

    const symbolRaw =
      meta?.symbol ??
      (typeof r.raw === "object" && r.raw ? (r.raw as any).instrument : undefined) ??
      "";
    const symbol = String(symbolRaw ?? "").trim().toUpperCase();
    if (symbolsSet && symbol && !symbolsSet.has(symbol)) continue;

    const direction = meta?.direction ?? null;
    if (directionSet && direction && !directionSet.has(direction)) continue;

    const openAtMs = typeof r.openAtMs === "number" ? r.openAtMs : undefined;
    const holdMs =
      typeof openAtMs === "number" && closedAt > openAtMs ? closedAt - openAtMs : undefined;
    if (typeof minHoldMs === "number" && typeof holdMs === "number" && holdMs < minHoldMs) {
      continue;
    }
    if (typeof maxHoldMs === "number" && typeof holdMs === "number" && holdMs > maxHoldMs) {
      continue;
    }

    closeEventCount += 1;
    realizedPnl += pnl;
    if (pnl >= 0) {
      wins += 1;
      grossWin += pnl;
    } else {
      losses += 1;
      grossLoss += pnl;
    }

    const fees = typeof r.fees === "number" ? r.fees : undefined;
    if (typeof fees === "number" && Number.isFinite(fees)) totalFees += fees;

    if (typeof holdMs === "number" && Number.isFinite(holdMs) && holdMs >= 0) {
      holdSum += holdMs;
      holdCount += 1;
    }

    const tradeKey =
      gid ||
      (typeof r.externalPositionId === "string" ? r.externalPositionId : "") ||
      (typeof r.externalEventId === "string" ? r.externalEventId : "");
    if (tradeKey) uniqueTradeIds.add(tradeKey);

    const wdRow =
      byWeekday[weekday] ?? (byWeekday[weekday] = { weekday, closeEventCount: 0, pnl: 0 });
    wdRow.closeEventCount += 1;
    wdRow.pnl += pnl;

    const hrRow = byHour[hour] ?? (byHour[hour] = { hour, closeEventCount: 0, pnl: 0 });
    hrRow.closeEventCount += 1;
    hrRow.pnl += pnl;

    const symKey = symbol || "UNKNOWN";
    const symRow =
      bySymbol[symKey] ?? (bySymbol[symKey] = { symbol: symKey, closeEventCount: 0, pnl: 0 });
    symRow.closeEventCount += 1;
    symRow.pnl += pnl;

    const dayRow = byDate[dateKey] ?? (byDate[dateKey] = { date: dateKey, pnl: 0 });
    dayRow.pnl += pnl;
  }

  const includeUnrealized = input.spec.includeUnrealized !== false;
  let unrealizedPnl = 0;
  if (includeUnrealized) {
    // v1: current unrealized snapshot, not filtered by weekday/hour.
    const positions = await ctx.db
      .query("tradePositions")
      .withIndex("by_org_user_openedAt", (q: any) =>
        q.eq("organizationId", input.organizationId).eq("userId", input.userId),
      )
      .order("desc")
      .take(1000);

    unrealizedPnl = (positions as any[]).reduce((acc, p) => {
      const v = typeof p.unrealizedPnl === "number" ? p.unrealizedPnl : 0;
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  }

  const equityPoints = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  const equityCurve = equityPoints.map((p) => {
    cumulative += p.pnl;
    return { date: p.date, pnl: p.pnl, cumulative };
  });

  let peak = 0;
  const drawdown = equityCurve.map((p) => {
    peak = Math.max(peak, p.cumulative);
    const dd = p.cumulative - peak;
    return { date: p.date, equity: p.cumulative, peak, drawdown: dd };
  });

  const profitFactor = grossLoss < 0 ? grossWin / Math.abs(grossLoss) : grossWin > 0 ? Infinity : 0;
  const winRate = closeEventCount > 0 ? wins / closeEventCount : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const expectancy = closeEventCount > 0 ? realizedPnl / closeEventCount : 0;
  const avgHoldMs = holdCount > 0 ? holdSum / holdCount : 0;

  const netPnl = realizedPnl + (Number.isFinite(unrealizedPnl) ? unrealizedPnl : 0);

  return {
    timezone: timeZone,
    fromMs,
    toMs,
    isTruncated,
    headline: {
      tradeCount: uniqueTradeIds.size,
      closeEventCount,
      realizedPnl,
      unrealizedPnl: Number.isFinite(unrealizedPnl) ? unrealizedPnl : 0,
      netPnl,
      totalFees,
      grossWin,
      grossLoss,
      profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
      wins,
      losses,
      winRate,
      avgWin,
      avgLoss,
      expectancy,
      avgHoldMs,
    },
    byWeekday: Object.values(byWeekday).sort((a, b) => a.weekday - b.weekday),
    byHour: Object.values(byHour).sort((a, b) => a.hour - b.hour),
    bySymbol: Object.values(bySymbol).sort((a, b) => b.pnl - a.pnl).slice(0, 50),
    equityCurve,
    drawdown,
  };
};

export const runAnalyticsReport = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    accountId: v.optional(v.string()),
    spec: analyticsReportSpecValidator,
  },
  returns: analyticsReportResultValidator,
  handler: async (ctx, args) => {
    return await computeAnalyticsReport(ctx, {
      organizationId: args.organizationId,
      userId: args.userId,
      accountId: args.accountId,
      spec: args.spec,
    });
  },
});

export const listMyAnalyticsReports = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      reportId: v.id("analyticsReports"),
      name: v.string(),
      accountId: v.optional(v.string()),
      visibility: v.union(v.literal("private"), v.literal("link")),
      shareToken: v.optional(v.string()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("analyticsReports")
      .withIndex("by_org_user_updatedAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(200);

    return (rows as any[]).map((r) => ({
      reportId: r._id as any,
      name: String(r.name ?? ""),
      accountId: typeof (r as any).accountId === "string" ? (r as any).accountId : undefined,
      visibility: normalizeVisibility((r as any).visibility),
      shareToken: typeof (r as any).shareToken === "string" ? (r as any).shareToken : undefined,
      updatedAt: Number((r as any).updatedAt ?? 0),
      createdAt: Number((r as any).createdAt ?? 0),
    })) as any;
  },
});

export const getMyAnalyticsReport = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reportId: v.id("analyticsReports"),
  },
  returns: v.union(
    v.object({
      reportId: v.id("analyticsReports"),
      name: v.string(),
      accountId: v.optional(v.string()),
      visibility: v.union(v.literal("private"), v.literal("link")),
      shareToken: v.optional(v.string()),
      spec: analyticsReportSpecValidator,
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.reportId);
    if (!row) return null;
    if (row.organizationId !== args.organizationId || row.userId !== args.userId) return null;
    return {
      reportId: row._id as any,
      name: String((row as any).name ?? ""),
      accountId: typeof (row as any).accountId === "string" ? (row as any).accountId : undefined,
      visibility: normalizeVisibility((row as any).visibility),
      shareToken: typeof (row as any).shareToken === "string" ? (row as any).shareToken : undefined,
      spec: (row as any).spec,
      updatedAt: Number((row as any).updatedAt ?? 0),
      createdAt: Number((row as any).createdAt ?? 0),
    } as any;
  },
});

export const getSharedAnalyticsReport = query({
  args: {
    shareToken: v.string(),
  },
  returns: v.union(
    v.object({
      reportId: v.id("analyticsReports"),
      name: v.string(),
      spec: analyticsReportSpecValidator,
      ownerUserId: v.string(),
      ownerOrganizationId: v.string(),
      result: analyticsReportResultValidator,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const token = String(args.shareToken ?? "").trim();
    if (!token) return null;

    const row = await ctx.db
      .query("analyticsReports")
      .withIndex("by_shareToken", (q: any) => q.eq("shareToken", token))
      .first();

    if (!row) return null;
    if ((row as any).visibility !== "link") return null;

    const ownerOrganizationId = String((row as any).organizationId ?? "");
    const ownerUserId = String((row as any).userId ?? "");
    const spec = (row as any).spec;
    if (!ownerOrganizationId || !ownerUserId || !isRecord(spec)) return null;
    if (spec.version !== 1) return null;
    if (typeof spec.timezone !== "string") return null;
    if (typeof spec.rangePreset !== "string") return null;

    const result = await computeAnalyticsReport(ctx, {
      organizationId: ownerOrganizationId,
      userId: ownerUserId,
      accountId: typeof (row as any).accountId === "string" ? (row as any).accountId : undefined,
      spec,
    });

    return {
      reportId: row._id as any,
      name: String((row as any).name ?? ""),
      spec: spec as any,
      ownerUserId,
      ownerOrganizationId,
      result,
    } as any;
  },
});

