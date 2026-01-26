"use client";

// Uses shared calendar + mobile drilldown (drawer) component.

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Brain, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { demoCalendarDailyStats, demoDashboardStats, demoReviewTrades } from "@acme/demo-data";
import { useConvexAuth, useQuery } from "convex/react";

import { ActiveAccountSelector } from "~/components/accounts/ActiveAccountSelector";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Calendar as DayCalendar } from "@acme/ui/calendar";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import Link from "next/link";
import React from "react";
import { TradingCalendarWithDrilldown } from "~/components/dashboard/TradingCalendarWithDrilldown";
import type { TradingCalendarWithDrilldownTradeRow } from "~/components/dashboard/TradingCalendarWithDrilldown";
import { TradingTimingInsights } from "~/components/dashboard/TradingTimingInsights";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { createPortal } from "react-dom";
import { format as formatDate } from "date-fns";
import { useActiveAccount } from "~/components/accounts/ActiveAccountProvider";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { useRouter } from "next/navigation";
import { useTenant } from "~/context/TenantContext";
import { useTradingCalendarStore } from "~/stores/tradingCalendarStore";

interface LiveReviewRow {
  tradeIdeaGroupId: string;
  symbol: string;
  direction: "long" | "short";
  closedAt: number;
  realizedPnl?: number;
  reviewStatus: "todo" | "reviewed";
}

interface DemoLikeReviewTrade {
  id: string;
  symbol: string;
  type: "Long" | "Short";
  date: string;
  reason: string;
  reviewed: boolean;
  pnl: number;
  tradeDate: string; // YYYY-MM-DD
}

interface InstrumentRow extends Record<string, unknown> {
  symbol: string;
  tradeCount: number;
  totalPnl: number;
  lastClosedAt: number;
}

const toDateKey = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  return d.toISOString().slice(0, 10);
};

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const computeStreakFromDailyStats = (dailyStats: { date: string }[]): number => {
  const set = new Set(dailyStats.map((s) => s.date));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
  }
  return streak;
};


function TooltipIcon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);


  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: rect.right,
    });
  };

  return (
    <div
      className="relative"
      ref={triggerRef}
      onMouseEnter={() => {
        updateCoords();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <Button variant="ghost" size="icon" aria-label={title}>
        <span className="text-muted-foreground">?</span>
      </Button>
      {typeof document !== "undefined"
        ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="pointer-events-none fixed inset-0 z-50"
              >
                <div className="pointer-events-none absolute inset-0 bg-black/50 backdrop-blur-sm" />
                <div
                  className="pointer-events-auto absolute z-10 w-64 -translate-x-full rounded-lg border border-border/40 bg-background/95 p-3 text-foreground shadow-xl backdrop-blur"
                  style={{
                    top: coords?.top ?? 0,
                    left: coords?.left ?? 0,
                  }}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                >
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{description}</div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
        : null}
    </div>
  );
}

export default function AdminJournalDashboardPage() {
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");
  const [statsScope, setStatsScope] = React.useState<"me" | "org">(() =>
    isOrgMode ? "org" : "me",
  );
  React.useEffect(() => {
    setStatsScope(isOrgMode ? "org" : "me");
  }, [isOrgMode, tenant?._id]);
  const isOrgStats = isOrgMode && statsScope === "org";

  const dataMode = useDataMode();
  const activeAccount = useActiveAccount();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const liveRowsRaw = useQuery(
    api.traderlaunchpad.queries.listMyNextTradeIdeasToReview,
    shouldQuery && dataMode.effectiveMode === "live"
      ? { limit: 200, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as LiveReviewRow[] | undefined;

  const demoLikeTrades: DemoLikeReviewTrade[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") {
      return demoReviewTrades as unknown as DemoLikeReviewTrade[];
    }

    const rows = Array.isArray(liveRowsRaw) ? liveRowsRaw : [];
    return rows
      .filter((r) => r.tradeIdeaGroupId)
      .map((r) => {
        const tradeDate = toDateKey(r.closedAt);
        const pnl = typeof r.realizedPnl === "number" ? r.realizedPnl : 0;
        return {
          id: String(r.tradeIdeaGroupId),
          symbol: r.symbol || "UNKNOWN",
          type: r.direction === "short" ? "Short" : "Long",
          date: toDateLabel(r.closedAt),
          reason: r.reviewStatus === "reviewed" ? "Reviewed" : "Pending review",
          reviewed: r.reviewStatus === "reviewed",
          pnl,
          tradeDate,
        };
      });
  }, [dataMode.effectiveMode, liveRowsRaw]);

  const liveMySymbolStats = useQuery(
    api.traderlaunchpad.queries.listMySymbolStats,
    shouldQuery && dataMode.effectiveMode === "live" && !isOrgStats
      ? { limit: 1500, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as InstrumentRow[] | undefined;

  const liveOrgSymbolStats = useQuery(
    api.traderlaunchpad.queries.listOrgSymbolStats,
    shouldQuery && dataMode.effectiveMode === "live" && isOrgStats && tenant
      ? { organizationId: tenant._id, limitPerUser: 200, maxMembers: 100 }
      : "skip",
  ) as
    | { rows: InstrumentRow[]; memberCountTotal: number; memberCountConsidered: number; isTruncated: boolean }
    | null
    | undefined;

  const demoSymbolStats = React.useMemo<InstrumentRow[]>(() => {
    const map: Record<string, InstrumentRow> = {};
    for (const t of demoLikeTrades) {
      const symbol = t.symbol.trim().toUpperCase() || "UNKNOWN";
      const cur =
        map[symbol] ??
        (map[symbol] = { symbol, tradeCount: 0, totalPnl: 0, lastClosedAt: 0 });
      cur.tradeCount += 1;
      cur.totalPnl += typeof t.pnl === "number" ? t.pnl : 0;
    }
    return Object.values(map);
  }, [demoLikeTrades]);

  const [instrumentSortBy, setInstrumentSortBy] = React.useState<"mostTraded" | "mostProfitable">(
    "mostTraded",
  );
  const [instrumentSortDir, setInstrumentSortDir] = React.useState<"desc" | "asc">("desc");

  const instrumentRows = React.useMemo<InstrumentRow[]>(() => {
    const base: InstrumentRow[] =
      dataMode.effectiveMode === "demo"
        ? demoSymbolStats
        : isOrgStats
          ? Array.isArray(liveOrgSymbolStats?.rows)
            ? liveOrgSymbolStats.rows
            : []
          : Array.isArray(liveMySymbolStats)
            ? liveMySymbolStats
            : [];

    const sorted = [...base].sort((a, b) => {
      const dir = instrumentSortDir === "asc" ? 1 : -1;
      if (instrumentSortBy === "mostProfitable") {
        return (a.totalPnl - b.totalPnl) * dir;
      }
      return (a.tradeCount - b.tradeCount) * dir;
    });

    return sorted;
  }, [
    dataMode.effectiveMode,
    demoSymbolStats,
    instrumentSortBy,
    instrumentSortDir,
    isOrgStats,
    liveMySymbolStats,
    liveOrgSymbolStats,
  ]);

  const instrumentColumns = React.useMemo<ColumnDefinition<InstrumentRow>[]>(() => {
    return [
      {
        id: "symbol",
        header: "Symbol",
        accessorKey: "symbol",
        cell: (r: InstrumentRow) => <div className="font-semibold">{r.symbol}</div>,
        sortable: true,
      },
      {
        id: "tradeCount",
        header: "Trades",
        accessorKey: "tradeCount",
        cell: (r: InstrumentRow) => (
          <span className="tabular-nums text-white/80">{r.tradeCount.toLocaleString()}</span>
        ),
        sortable: true,
      },
      {
        id: "totalPnl",
        header: "PnL",
        accessorKey: "totalPnl",
        cell: (r: InstrumentRow) => (
          <span
            className={cn(
              "tabular-nums font-medium",
              r.totalPnl >= 0 ? "text-emerald-300" : "text-rose-300",
            )}
          >
            {r.totalPnl >= 0 ? "+" : "-"}${Math.abs(r.totalPnl).toFixed(0)}
          </span>
        ),
        sortable: true,
      },
    ];
  }, []);

  const [openTradeId, setOpenTradeId] = React.useState<string | null>(null);
  const [tradeColumns, setTradeColumns] = React.useState<{
    showSize: boolean;
    showHold: boolean;
    showFees: boolean;
  }>({ showSize: false, showHold: false, showFees: false });
  const selectedTradeDate = useTradingCalendarStore((state) => state.selectedDate);
  const setSelectedTradeDate = useTradingCalendarStore((state) => state.setSelectedDate);

  React.useEffect(() => {
    setOpenTradeId(null);
  }, [selectedTradeDate]);

  const totalTrades = demoLikeTrades.length;
  const avgPnl =
    totalTrades > 0
      ? demoLikeTrades.reduce((sum, t) => sum + t.pnl, 0) / totalTrades
      : 0;

  const liveCalendarDailyStats = useQuery(
    api.traderlaunchpad.queries.listMyCalendarDailyStats,
    shouldQuery && dataMode.effectiveMode === "live"
      ? { daysBack: 90, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as
    | {
      date: string;
      pnl: number;
      wins: number;
      losses: number;
      unrealizedPnl?: number;
    }[]
    | undefined;

  const liveCalendarEvents = useQuery(
    api.traderlaunchpad.queries.listMyCalendarRealizationEvents,
    shouldQuery && dataMode.effectiveMode === "live"
      ? { daysBack: 90, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as
    | {
      externalEventId: string;
      tradeIdeaGroupId?: string;
      externalPositionId: string;
      externalOrderId?: string;
      symbol: string | null;
      direction: "long" | "short" | null;
      openAtMs?: number;
      openPrice?: number;
      closePrice?: number;
      commission?: number;
      swap?: number;
      openOrderId?: string;
      openTradeId?: string;
      closeTradeId?: string;
      closedAt: number;
      realizedPnl: number;
      fees?: number;
      qtyClosed?: number;
    }[]
    | undefined;

  const dailyStats = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") return demoCalendarDailyStats;
    return Array.isArray(liveCalendarDailyStats) ? liveCalendarDailyStats : [];
  }, [dataMode.effectiveMode, liveCalendarDailyStats]);

  const streak = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") return demoDashboardStats.streak;
    return computeStreakFromDailyStats(dailyStats);
  }, [dataMode.effectiveMode, dailyStats]);

  const selectedDateObj = React.useMemo(() => {
    if (!selectedTradeDate) return undefined;
    const d = new Date(`${selectedTradeDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
  }, [selectedTradeDate]);

  const selectedDateLabel = React.useMemo(() => {
    if (!selectedDateObj) return "All dates";
    return formatDate(selectedDateObj, "MMM d, yyyy");
  }, [selectedDateObj]);

  const handleSelectDate = (d: Date | undefined) => {
    if (!d) {
      setSelectedTradeDate(null);
      return;
    }
    setSelectedTradeDate(formatDate(d, "yyyy-MM-dd"));
  };

  const calendarTradeIdeaIdByEventId = React.useMemo(() => {
    const map = new Map<string, string>();
    const rows = Array.isArray(liveCalendarEvents) ? liveCalendarEvents : [];
    for (const r of rows) {
      const eventId = r.externalEventId.trim();
      const gid = typeof r.tradeIdeaGroupId === "string" ? r.tradeIdeaGroupId : "";
      if (eventId && gid) map.set(eventId, gid);
    }
    return map;
  }, [liveCalendarEvents]);

  const getCalendarTradeHref = React.useCallback(
    (eventId: string) => {
      if (dataMode.effectiveMode === "demo") return `/admin/trade/${eventId}`;
      const gid = calendarTradeIdeaIdByEventId.get(eventId);
      return gid ? `/admin/tradeideas/${encodeURIComponent(gid)}` : "/admin/orders";
    },
    [calendarTradeIdeaIdByEventId, dataMode.effectiveMode],
  );

  const calendarTrades: TradingCalendarWithDrilldownTradeRow[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") {
      return demoLikeTrades.map((t) => ({
        id: t.id,
        tradeDate: t.tradeDate,
        symbol: t.symbol,
        type: t.type,
        reviewed: t.reviewed,
        reason: t.reason,
        pnl: t.pnl,
      }));
    }

    const rows = Array.isArray(liveCalendarEvents) ? liveCalendarEvents : [];
    return rows.map((e) => {
      const d = new Date(e.closedAt);
      const tradeDate = Number.isNaN(d.getTime()) ? "1970-01-01" : d.toISOString().slice(0, 10);
      const qtyLabel =
        typeof e.qtyClosed === "number" && Number.isFinite(e.qtyClosed) && e.qtyClosed !== 0
          ? ` • ${Math.abs(e.qtyClosed)}`
          : "";
      return {
        id: e.externalEventId ? e.externalEventId : `${e.externalPositionId}:${e.closedAt}`,
        tradeDate,
        symbol: typeof e.symbol === "string" && e.symbol.trim() ? e.symbol.trim() : "—",
        type: e.direction === "short" ? "Short" : "Long",
        reviewed: false,
        reason: `Partial close${qtyLabel}`,
        pnl: typeof e.realizedPnl === "number" ? e.realizedPnl : 0,
        qtyClosed: typeof e.qtyClosed === "number" ? e.qtyClosed : undefined,
        fees: typeof e.fees === "number" ? e.fees : undefined,
        commission: typeof e.commission === "number" ? e.commission : undefined,
        swap: typeof e.swap === "number" ? e.swap : undefined,
        openAtMs: typeof e.openAtMs === "number" ? e.openAtMs : undefined,
        closedAtMs: typeof e.closedAt === "number" ? e.closedAt : undefined,
        openPrice: typeof e.openPrice === "number" ? e.openPrice : undefined,
        closePrice: typeof e.closePrice === "number" ? e.closePrice : undefined,
        externalPositionId:
          typeof e.externalPositionId === "string" ? e.externalPositionId : undefined,
        openOrderId: typeof e.openOrderId === "string" ? e.openOrderId : undefined,
        closeOrderId: typeof e.externalOrderId === "string" ? e.externalOrderId : undefined,
        openTradeId: typeof e.openTradeId === "string" ? e.openTradeId : undefined,
        closeTradeId: typeof e.closeTradeId === "string" ? e.closeTradeId : undefined,
      };
    });
  }, [dataMode.effectiveMode, demoLikeTrades, liveCalendarEvents]);

  const tradesForSelectedDate = selectedTradeDate
    ? demoLikeTrades.filter((trade) => trade.tradeDate === selectedTradeDate)
    : demoLikeTrades;

  const formatHoldTime = React.useCallback((durationMs: number): string => {
    const ms = Math.max(0, Math.floor(durationMs));
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) return `${minutes}m`;
    if (minutes <= 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }, []);

  const metaByTradeIdeaGroupIdForSelectedDate = React.useMemo(() => {
    const map = new Map<
      string,
      { qtyClosed?: number; fees?: number; holdMsMax?: number }
    >();
    if (dataMode.effectiveMode !== "live") return map;
    if (!selectedTradeDate) return map;

    const rows = Array.isArray(liveCalendarEvents) ? liveCalendarEvents : [];

    for (const e of rows) {
      const gid = typeof e.tradeIdeaGroupId === "string" ? e.tradeIdeaGroupId : "";
      if (!gid) continue;
      const closedAt = typeof e.closedAt === "number" ? e.closedAt : 0;
      if (!closedAt || !Number.isFinite(closedAt)) continue;
      const dateKey = toDateKey(closedAt);
      if (dateKey !== selectedTradeDate) continue;

      const cur = map.get(gid) ?? { qtyClosed: 0, fees: 0, holdMsMax: 0 };

      if (typeof e.qtyClosed === "number" && Number.isFinite(e.qtyClosed)) {
        cur.qtyClosed = (cur.qtyClosed ?? 0) + e.qtyClosed;
      }
      if (typeof e.fees === "number" && Number.isFinite(e.fees)) {
        cur.fees = (cur.fees ?? 0) + e.fees;
      }
      if (
        typeof e.openAtMs === "number" &&
        Number.isFinite(e.openAtMs) &&
        closedAt > e.openAtMs
      ) {
        cur.holdMsMax = Math.max(cur.holdMsMax ?? 0, closedAt - e.openAtMs);
      }

      map.set(gid, cur);
    }

    return map;
  }, [dataMode.effectiveMode, liveCalendarEvents, selectedTradeDate]);

  const router = useRouter();

  return (
    <div className="relative animate-in fade-in space-y-8 text-foreground selection:bg-orange-500/30 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <p className="mt-1 text-muted-foreground">
            Review trades, stay consistent, and spot patterns faster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="gap-2 border-0 bg-orange-600 text-white hover:bg-orange-700"
          >
            <Link href="/admin/orders">
              <Clock className="h-4 w-4" />
              Review trades
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Date filter (syncs with TradingCalendarPanel) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          {isOrgMode ? (
            <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
              <button
                type="button"
                aria-current={!isOrgStats ? "page" : undefined}
                onClick={() => setStatsScope("me")}
                className={cn(
                  "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                  !isOrgStats && "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
                )}
              >
                My stats
              </button>
              <button
                type="button"
                aria-current={isOrgStats ? "page" : undefined}
                onClick={() => setStatsScope("org")}
                className={cn(
                  "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
                  isOrgStats && "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
                )}
              >
                {tenant?.name ? `${tenant.name} stats` : "Organization stats"}
              </button>
            </div>
          ) : null}

          {!isOrgStats ? (
            <ActiveAccountSelector className="w-full sm:w-auto" />
          ) : (
            <Badge
              variant="secondary"
              className="h-9 border border-border/60 bg-background/40 text-foreground/80"
            >
              Viewing org totals
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <Calendar className="mr-2 h-4 w-4 text-orange-300" />
                {selectedDateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-border/40 bg-background/95 p-3 text-foreground backdrop-blur">
              <DayCalendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleSelectDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {selectedTradeDate ? (
            <Badge
              variant="secondary"
              className="border border-orange-500/25 bg-orange-500/10 text-orange-200"
              onClick={() => setSelectedTradeDate(null)}
            >
              Clear
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <TradingCalendarWithDrilldown
            dailyStats={dailyStats}
            trades={calendarTrades}
            selectedDate={selectedTradeDate}
            onSelectDateAction={setSelectedTradeDate}
            getTradeHrefAction={getCalendarTradeHref}
          />

          <div className="relative">
            {dataMode.effectiveMode === "demo" ? (
              <TradingTimingInsights />
            ) : (
              <Card className="border-border/40 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Trading Timing Insights</CardTitle>
                    <Badge variant="outline">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Coming soon — we’ll calculate best hours/days from your synced executions.
                </CardContent>
              </Card>
            )}
            <div className="absolute top-4 right-4">
              <TooltipIcon
                title="Trading Timing Insights"
                description="Aggregated PnL by hour and day to highlight your strongest sessions."
              />
            </div>
          </div>

          <Card className="border-border/40 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Trading Instruments</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {isOrgStats
                      ? "Org-wide (members) • Sort by Most Traded / Most Profitable"
                      : "Your trades • Sort by Most Traded / Most Profitable"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={instrumentSortBy === "mostTraded" ? "secondary" : "outline"}
                    className="h-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                    onClick={() => setInstrumentSortBy("mostTraded")}
                  >
                    Most Traded
                  </Button>
                  <Button
                    type="button"
                    variant={instrumentSortBy === "mostProfitable" ? "secondary" : "outline"}
                    className="h-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                    onClick={() => setInstrumentSortBy("mostProfitable")}
                  >
                    Most Profitable
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
                    onClick={() => setInstrumentSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  >
                    {instrumentSortDir === "desc" ? "Desc" : "Asc"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <EntityList<InstrumentRow>
                data={instrumentRows}
                columns={instrumentColumns}
                isLoading={
                  dataMode.effectiveMode === "live"
                    ? isOrgStats
                      ? liveOrgSymbolStats === undefined
                      : liveMySymbolStats === undefined
                    : false
                }
                defaultViewMode="list"
                viewModes={["list"]}
                enableSearch={true}
                onRowClick={(r) =>
                  router.push(`/admin/journal/symbol/${encodeURIComponent(r.symbol)}`)
                }
                getRowId={(r: InstrumentRow) => r.symbol}
                emptyState={
                  <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/40">
                    <div className="text-lg font-medium text-foreground">No instruments</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      No trades found to aggregate yet.
                    </div>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-3">
            <Card className="gap-2 border-l-4 border-white/10 border-l-purple-500 bg-white/3 p-2 backdrop-blur-md transition-colors hover:bg-white/6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1.5">
                <CardTitle className="text-muted-foreground text-[11px] font-medium">
                  Journal Streak
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Brain className="text-muted-foreground h-3.5 w-3.5" />
                  <TooltipIcon
                    title="Journal Streak"
                    description="Consecutive days you logged and reviewed your trades."
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold leading-none tabular-nums">
                  {streak} Days
                </div>
                <p className="mt-0.5 text-[11px] leading-tight text-white/60">
                  Keep it up. Consistency compounds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/3 p-3 backdrop-blur-md transition-colors hover:bg-white/6">
              <CardContent className="p-0">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span className="tabular-nums">
                    {totalTrades.toLocaleString()} trades
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      avgPnl >= 0 ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    Avg {avgPnl >= 0 ? "+" : "-"}${Math.abs(avgPnl).toFixed(0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[530px] border-l-4 border-white/10 border-l-orange-500 bg-white/3 shadow-lg shadow-orange-500/5 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-orange-300" />
                  Trades
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hidden h-8 border-white/15 bg-transparent px-2 text-xs text-white hover:bg-white/10 hover:text-white md:inline-flex"
                      >
                        Columns
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 border-white/10 bg-black/80 p-3 text-white backdrop-blur">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-white/80">
                          Optional fields
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm">Size</div>
                          <Checkbox
                            checked={tradeColumns.showSize}
                            onCheckedChange={(checked) =>
                              setTradeColumns((s) => ({
                                ...s,
                                showSize: Boolean(checked),
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm">Hold time</div>
                          <Checkbox
                            checked={tradeColumns.showHold}
                            onCheckedChange={(checked) =>
                              setTradeColumns((s) => ({
                                ...s,
                                showHold: Boolean(checked),
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm">Fees</div>
                          <Checkbox
                            checked={tradeColumns.showFees}
                            onCheckedChange={(checked) =>
                              setTradeColumns((s) => ({
                                ...s,
                                showFees: Boolean(checked),
                              }))
                            }
                          />
                        </div>
                        <div className="pt-1 text-[11px] text-white/55">
                          (Desktop-only)
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Badge
                    variant="secondary"
                    className="bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
                  >
                    {selectedTradeDate ? "Filtered" : "All"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  {selectedTradeDate ? selectedDateLabel : "Recent trades"}
                </div>
                <TooltipIcon
                  title="Trades List"
                  description="Shows trades filtered by the selected calendar date with review status."
                />
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {tradesForSelectedDate.map((trade) => {
                  const meta =
                    dataMode.effectiveMode === "live" && selectedTradeDate
                      ? metaByTradeIdeaGroupIdForSelectedDate.get(trade.id)
                      : undefined;
                  const showMeta =
                    tradeColumns.showSize || tradeColumns.showHold || tradeColumns.showFees;

                  return (
                    <Popover
                      key={trade.id}
                      open={openTradeId === trade.id}
                      onOpenChange={(next) => setOpenTradeId(next ? trade.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="bg-card group flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors hover:border-blue-500/50"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {trade.symbol}
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                  trade.type === "Long"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-red-500/10 text-red-500",
                                )}
                              >
                                {trade.type}
                              </span>
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                                  trade.reviewed
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-amber-500/10 text-amber-500",
                                )}
                              >
                                {trade.reviewed ? "Reviewed" : "Needs Review"}
                              </span>
                            </div>
                            <div className="text-xs text-white/60">
                              {trade.date} • {trade.reason}
                              {showMeta && meta ? (
                                <span className="hidden md:inline">
                                  {tradeColumns.showSize &&
                                    typeof meta.qtyClosed === "number" &&
                                    Number.isFinite(meta.qtyClosed) ? (
                                    <>
                                      <span className="px-1.5 text-white/30">•</span>
                                      Size {meta.qtyClosed.toFixed(2)}
                                    </>
                                  ) : null}
                                  {tradeColumns.showHold &&
                                    typeof meta.holdMsMax === "number" &&
                                    Number.isFinite(meta.holdMsMax) &&
                                    meta.holdMsMax > 0 ? (
                                    <>
                                      <span className="px-1.5 text-white/30">•</span>
                                      Hold {formatHoldTime(meta.holdMsMax)}
                                    </>
                                  ) : null}
                                  {tradeColumns.showFees &&
                                    typeof meta.fees === "number" &&
                                    Number.isFinite(meta.fees) ? (
                                    <>
                                      <span className="px-1.5 text-white/30">•</span>
                                      Fees {meta.fees >= 0 ? "+" : ""}
                                      {meta.fees.toFixed(2)}
                                    </>
                                  ) : null}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "text-sm font-semibold",
                              trade.pnl >= 0 ? "text-emerald-500" : "text-red-500",
                            )}
                          >
                            {trade.pnl >= 0 ? "+" : ""}
                            {trade.pnl}
                          </div>
                        </button>
                      </PopoverTrigger>

                      <PopoverContent className="w-[320px] border-white/10 bg-black/80 p-3 text-white backdrop-blur">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">
                              {trade.symbol} • {trade.type}
                            </div>
                            <div className="mt-0.5 text-xs text-white/60">
                              {trade.tradeDate} • {trade.reason}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "shrink-0 text-sm font-semibold tabular-nums",
                              trade.pnl >= 0 ? "text-emerald-300" : "text-rose-300",
                            )}
                          >
                            {trade.pnl >= 0 ? "+" : ""}
                            {trade.pnl}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-white/15 text-[10px]",
                              trade.reviewed ? "text-emerald-200" : "text-amber-200",
                            )}
                          >
                            {trade.reviewed ? "Reviewed" : "Needs review"}
                          </Badge>
                          <Button
                            size="sm"
                            className="h-8 bg-orange-600 px-2 text-xs text-white hover:bg-orange-700"
                            asChild
                          >
                            <Link
                              href={
                                dataMode.effectiveMode === "demo"
                                  ? `/admin/trade/${trade.id}`
                                  : `/admin/tradeideas/${encodeURIComponent(trade.id)}`
                              }
                            >
                              View Trade <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>

                        {showMeta ? (
                          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/70">
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <div className="text-white/50">Size</div>
                              <div className="mt-0.5 tabular-nums">
                                {typeof meta?.qtyClosed === "number" &&
                                  Number.isFinite(meta.qtyClosed)
                                  ? meta.qtyClosed.toFixed(2)
                                  : "—"}
                              </div>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <div className="text-white/50">Hold</div>
                              <div className="mt-0.5 tabular-nums">
                                {typeof meta?.holdMsMax === "number" &&
                                  Number.isFinite(meta.holdMsMax) &&
                                  meta.holdMsMax > 0
                                  ? formatHoldTime(meta.holdMsMax)
                                  : "—"}
                              </div>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 p-2">
                              <div className="text-white/50">Fees</div>
                              <div className="mt-0.5 tabular-nums">
                                {typeof meta?.fees === "number" && Number.isFinite(meta.fees)
                                  ? `${meta.fees >= 0 ? "+" : ""}${meta.fees.toFixed(2)}`
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>

              <Button
                variant="outline"
                className="w-full border-white/15 bg-transparent text-xs text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/admin/orders">Open Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}