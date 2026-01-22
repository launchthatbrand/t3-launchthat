"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Brain, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { demoCalendarDailyStats, demoDashboardStats, demoReviewTrades } from "@acme/demo-data";
import { useConvexAuth, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar as DayCalendar } from "@acme/ui/calendar";
import Link from "next/link";
import React from "react";
import { TradingCalendarPanel } from "~/components/dashboard/TradingCalendarPanel";
import { TradingTimingInsights } from "~/components/dashboard/TradingTimingInsights";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { createPortal } from "react-dom";
import { format as formatDate } from "date-fns";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { ActiveAccountSelector } from "~/components/accounts/ActiveAccountSelector";
import { useActiveAccount } from "~/components/accounts/ActiveAccountProvider";
import { useTradingCalendarStore } from "~/stores/tradingCalendarStore";

type LiveReviewRow = {
  tradeIdeaGroupId: string;
  symbol: string;
  direction: "long" | "short";
  closedAt: number;
  realizedPnl?: number;
  reviewStatus: "todo" | "reviewed";
};

type DemoLikeReviewTrade = {
  id: string;
  symbol: string;
  type: "Long" | "Short";
  date: string;
  reason: string;
  reviewed: boolean;
  pnl: number;
  tradeDate: string; // YYYY-MM-DD
};

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

const computeStreakFromDailyStats = (dailyStats: Array<{ date: string }>): number => {
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
        <span className="text-white/60">?</span>
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
                <div className="pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div
                  className="pointer-events-auto absolute z-10 w-64 -translate-x-full rounded-lg border border-white/10 bg-black/85 p-3 shadow-xl backdrop-blur"
                  style={{
                    top: coords?.top ?? 0,
                    left: coords?.left ?? 0,
                  }}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                >
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-xs text-white/60">{description}</div>
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
      .filter((r) => r && typeof r.tradeIdeaGroupId === "string" && r.tradeIdeaGroupId)
      .map((r) => {
        const tradeDate = toDateKey(r.closedAt);
        const pnl = typeof r.realizedPnl === "number" ? r.realizedPnl : 0;
        return {
          id: String(r.tradeIdeaGroupId),
          symbol: String(r.symbol ?? "UNKNOWN"),
          type: r.direction === "short" ? "Short" : "Long",
          date: toDateLabel(r.closedAt),
          reason: r.reviewStatus === "reviewed" ? "Reviewed" : "Pending review",
          reviewed: r.reviewStatus === "reviewed",
          pnl,
          tradeDate,
        };
      });
  }, [dataMode.effectiveMode, liveRowsRaw]);

  const [openTradeId, setOpenTradeId] = React.useState<string | null>(null);
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

  const dailyStats = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") return demoCalendarDailyStats;

    const map: Record<
      string,
      { date: string; pnl: number; wins: number; losses: number }
    > = {};
    for (const t of demoLikeTrades) {
      const key = t.tradeDate;
      const stat = map[key] ?? (map[key] = { date: key, pnl: 0, wins: 0, losses: 0 });
      stat.pnl += t.pnl;
      if (t.pnl >= 0) stat.wins += 1;
      else stat.losses += 1;
    }
    return Object.values(map);
  }, [dataMode.effectiveMode, demoLikeTrades]);

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

  const tradesForSelectedDate = selectedTradeDate
    ? demoLikeTrades.filter((trade) => trade.tradeDate === selectedTradeDate)
    : demoLikeTrades;

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <p className="mt-1 text-white/60">
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
          <ActiveAccountSelector />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Calendar className="mr-2 h-4 w-4 text-orange-300" />
                {selectedDateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-white/10 bg-black/90 p-3 text-white backdrop-blur">
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
          <TradingCalendarPanel
            dailyStats={dailyStats}
            selectedDate={selectedTradeDate}
            onSelectDateAction={setSelectedTradeDate}
            className="min-h-[340px]"
            contentClassName="h-full"
          />

          <div className="relative">
            {dataMode.effectiveMode === "demo" ? (
              <TradingTimingInsights />
            ) : (
              <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Trading Timing Insights</CardTitle>
                    <Badge variant="outline">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-white/60">
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
                <Badge
                  variant="secondary"
                  className="bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
                >
                  {selectedTradeDate ? "Filtered" : "All"}
                </Badge>
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
                {tradesForSelectedDate.map((trade) => (
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
                                : `/admin/tradeidea/${encodeURIComponent(trade.id)}`
                            }
                          >
                            View Trade <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
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