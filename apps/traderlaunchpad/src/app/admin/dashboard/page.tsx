"use client";

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  HelpCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  demoCalendarDailyStats,
  demoDashboardStats,
  demoInsights,
  demoReviewTrades,
} from "@acme/demo-data";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar as DayCalendar } from "@acme/ui/calendar";
import Link from "next/link";
import { Progress } from "@acme/ui/progress";
import React from "react";
import { TradingCalendarPanel } from "~/components/dashboard/TradingCalendarPanel";
import { TradingTimingInsights } from "~/components/dashboard/TradingTimingInsights";
import { cn } from "@acme/ui";
import { createPortal } from "react-dom";
import { format as formatDate } from "date-fns";
import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";
import { useTradingCalendarStore } from "~/stores/tradingCalendarStore";

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
        <HelpCircle className="h-3.5 w-3.5" />
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
                  <div className="text-muted-foreground mt-1 text-xs">
                    {description}
                  </div>
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

const INSIGHT_ICON: Record<
  (typeof demoInsights)[number]["icon"],
  { Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  trendingUp: { Icon: TrendingUp, color: "text-emerald-500" },
  alertCircle: { Icon: AlertCircle, color: "text-amber-500" },
  calendar: { Icon: Calendar, color: "text-blue-500" },
};

export default function AdminDashboardPage() {
  const onboarding = useOnboardingStatus();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const selectedTradeDate = useTradingCalendarStore(
    (state) => state.selectedDate,
  );
  const setSelectedTradeDate = useTradingCalendarStore(
    (state) => state.setSelectedDate,
  );

  const totalTrades = demoReviewTrades.length;
  const avgPnl =
    totalTrades > 0
      ? demoReviewTrades.reduce((sum, t) => sum + t.pnl, 0) / totalTrades
      : 0;

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

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("tl_onboarding_dismissed_at");
      if (!raw) return;
      const ts = Number(raw);
      if (!Number.isFinite(ts)) return;
      const within24h = Date.now() - ts < 24 * 60 * 60 * 1000;
      if (within24h) setIsDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("tl_onboarding_dismissed_at", String(Date.now()));
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Page header (match /admin/orders) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-white/60">
            Your performance, insights, and reviews — synced with your trading
            calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="gap-2 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => {
              // mock action
              console.log("sync account (mock)");
            }}
          >
            <Activity className="h-4 w-4" />
            Sync Account
          </Button>
        </div>
      </div>

      {!isDismissed && !onboarding.isComplete ? (
        <Card className="py-2 relative overflow-hidden border-orange-500/20 bg-linear-to-br from-orange-500/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  Finish setup: {onboarding.completedSteps}/
                  {onboarding.totalSteps} completed
                </CardTitle>
                <div className="text-muted-foreground text-sm">
                  Connect your broker, sync trades, then review your first
                  TradeIdea.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDismiss}>
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  asChild
                >
                  <Link
                    href={
                      onboarding.nextStepHref ?? "/admin/onboarding/connect"
                    }
                  >
                    Continue setup <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress
              value={Math.round(
                (onboarding.completedSteps / onboarding.totalSteps) * 100,
              )}
              className="h-2"
            />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    onboarding.connectedOk
                      ? "bg-emerald-500"
                      : "bg-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    onboarding.connectedOk ? "text-emerald-500" : "",
                  )}
                >
                  Connected
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    onboarding.tradesOk
                      ? "bg-emerald-500"
                      : "bg-muted-foreground",
                  )}
                />
                <span
                  className={cn(onboarding.tradesOk ? "text-emerald-500" : "")}
                >
                  Trades imported
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    onboarding.reviewOk
                      ? "bg-emerald-500"
                      : "bg-muted-foreground",
                  )}
                />
                <span
                  className={cn(onboarding.reviewOk ? "text-emerald-500" : "")}
                >
                  First review
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}



      {/* Date filter (moved down; syncs with TradingCalendarPanel) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Calendar className="h-4 w-4" />
                <span>{selectedDateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-white/10 bg-black/70 p-0 text-white">
              <DayCalendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleSelectDate}
                initialFocus
              />
              <div className="flex items-center justify-between border-t border-white/10 p-2">
                <Button
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setSelectedTradeDate(null)}
                >
                  Clear
                </Button>
                <Button
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  onClick={() => handleSelectDate(new Date())}
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {selectedTradeDate ? (
            <Badge
              variant="secondary"
              className="border border-orange-500/25 bg-orange-500/10 text-orange-200"
            >
              Filtering
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/15 text-white/70">
              All data
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-2 gap-2 relative overflow-hidden border-l-4 border-white/10 border-l-emerald-500 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
              <CardHeader className=" p-0 flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-muted-foreground text-[11px] font-medium">
                  Account Balance
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 p-0.5 text-emerald-500">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                  <TooltipIcon
                    title="Account Balance"
                    description="Current account equity including open positions and realized PnL."
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold leading-none tabular-nums">
                  ${demoDashboardStats.balance.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                  <span className="font-medium text-emerald-500">
                    +{demoDashboardStats.monthlyReturn}%
                  </span>{" "}
                  this month
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 gap-2 border-l-4 border-white/10 border-l-orange-500 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
              <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-1.5">
                <CardTitle className="text-muted-foreground text-[11px] font-medium">
                  Win Rate
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Target className="text-muted-foreground h-3.5 w-3.5" />
                  <TooltipIcon
                    title="Win Rate"
                    description="Percentage of closed trades that ended in profit over the selected period."
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold leading-none tabular-nums">
                  {demoDashboardStats.winRate}%
                </div>
                <Progress
                  value={demoDashboardStats.winRate}
                  className="mt-1.5 h-1.5 bg-blue-100 dark:bg-blue-950"
                />
              </CardContent>
            </Card>

            <Card className="p-2 gap-2 border-l-4 border-white/10 border-l-orange-500 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1.5">
                <CardTitle className="text-muted-foreground text-[11px] font-medium">
                  Profit Factor
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Activity className="text-muted-foreground h-3.5 w-3.5" />
                  <TooltipIcon
                    title="Profit Factor"
                    description="Gross profits divided by gross losses. >1 means profitable."
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-lg font-bold leading-none tabular-nums">
                  {demoDashboardStats.profitFactor}
                </div>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                  Target: 2.0+{" "}
                  <span className="ml-1 font-medium text-amber-500">
                    (Excellent)
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="p-2 gap-2 border-l-4 border-white/10 border-l-purple-500 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
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
                  {demoDashboardStats.streak} Days
                </div>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                  Keep it up! Consistency is key.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-8 lg:col-span-1">
          <Card className="p-3 h-full mrelative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-50" />
            <CardContent className="p-0 relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarImage
                      src="https://api.dicebear.com/9.x/thumbs/svg?seed=nova_trader"
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-white/10 text-xs text-white/80">
                      TL
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/60">
                      Your public profile
                    </div>
                    <div className="truncate text-sm font-semibold text-white/85">
                      Visible to the community
                    </div>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="h-8 shrink-0 border-white/15 bg-transparent px-2 text-xs text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/admin/public-profile">
                    Edit <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-white/60">
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
      </div>



      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Charts & Insights (2/3 width) */}

        <div className="space-y-8 lg:col-span-2">
          {/* KPI Grid */}

          <TradingCalendarPanel
            dailyStats={demoCalendarDailyStats}
            selectedDate={selectedTradeDate}
            onSelectDateAction={setSelectedTradeDate}
            className="min-h-[340px]"
            contentClassName="h-full"
          />

          {/* Equity Curve Placeholder */}
          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Your equity curve over the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="group relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/10 bg-linear-to-b from-orange-500/10 to-transparent">
                <div className="absolute inset-0 flex items-center justify-center font-medium text-white/30">
                  [ Interactive Chart Component ]
                </div>
                {/* Simulated Chart Line */}
                <svg
                  className="absolute right-0 bottom-0 left-0 h-full w-full opacity-30 transition-opacity group-hover:opacity-50"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,250 C100,240 200,280 300,200 C400,120 500,180 600,100 C700,20 800,50 900,10 L900,300 L0,300 Z"
                    fill="url(#gradient)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#f97316"
                        stopOpacity="0.45"
                      />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-300" />
                <CardTitle>Trading Coach Insights</CardTitle>
              </div>
              <CardDescription className="text-white/60">
                AI-driven analysis of your recent behavior and performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {demoInsights.map((insight) => {
                const meta = INSIGHT_ICON[insight.icon];
                const Icon = meta.Icon;
                return (
                  <div
                    key={insight.id}
                    className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/3 p-4 transition-colors hover:bg-white/6"
                  >
                    <div
                      className={cn(
                        "rounded-full border border-white/10 bg-black/30 p-2 shadow-sm",
                        meta.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{insight.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Recent (1/3 width) */}
        <div className="space-y-8">

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
              <TooltipIcon
                title="Trades List"
                description="Shows trades filtered by the selected calendar date with review status."
              />
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {(selectedTradeDate
                  ? demoReviewTrades.filter(
                    (trade) => trade.tradeDate === selectedTradeDate,
                  )
                  : demoReviewTrades
                ).map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-card group flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors hover:border-blue-500/50"
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
                      <div className="text-muted-foreground text-xs">
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
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-white/15 bg-transparent text-xs text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/admin/tradeideas?status=closed">
                  View All Pending
                </Link>
              </Button>
            </CardContent>
          </Card>
          <div className="relative">
            <TradingTimingInsights />
            <div className="absolute top-4 right-4">
              <TooltipIcon
                title="Trading Timing Insights"
                description="Aggregated PnL by hour and day to highlight your strongest sessions."
              />
            </div>
          </div>


          {/* Quick Actions */}
          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex h-auto flex-col items-center justify-center gap-1 border-white/15 bg-transparent py-3 text-xs text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/admin/journal">
                  <Calendar className="mb-1 h-4 w-4" />
                  Journal
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex h-auto flex-col items-center justify-center gap-1 border-white/15 bg-transparent py-3 text-xs text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/admin/analytics">
                  <Activity className="mb-1 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
