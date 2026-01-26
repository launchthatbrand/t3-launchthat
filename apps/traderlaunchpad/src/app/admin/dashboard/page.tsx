"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Brain,
  Calendar,
  Clock,
  HelpCircle,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
  demoOrgAggregateTradeIdeaAnalyticsSummary,
  demoReviewTrades,
} from "@acme/demo-data";
import { useAction, useConvexAuth, useQuery } from "convex/react";

import { ActiveAccountSelector } from "~/components/accounts/ActiveAccountSelector";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar as DayCalendar } from "@acme/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@acme/ui/chart";
import type { ChartConfig } from "@acme/ui/chart";
import Link from "next/link";
import { Progress } from "@acme/ui/progress";
import { PublicProfileHeader } from "~/components/publicProfiles/PublicProfileHeader";
import React from "react";
import { TradingCalendarWithDrilldown } from "~/components/dashboard/TradingCalendarWithDrilldown";
import type { TradingCalendarWithDrilldownTradeRow } from "~/components/dashboard/TradingCalendarWithDrilldown";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { createPortal } from "react-dom";
import { format as formatDate } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useActiveAccount } from "~/components/accounts/ActiveAccountProvider";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";
import { useTenant } from "~/context/TenantContext";
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
                <div className="pointer-events-none absolute inset-0 bg-background/60 backdrop-blur-sm" />
                <div
                  className="pointer-events-auto absolute z-10 w-64 -translate-x-full rounded-lg border border-border/40 bg-white/95 p-3 text-foreground shadow-xl backdrop-blur dark:border-white/10 dark:bg-black/85 dark:text-white"
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

type InsightIcon = "trendingUp" | "alertCircle" | "calendar";

const INSIGHT_ICON: Record<
  InsightIcon,
  { Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  trendingUp: { Icon: TrendingUp, color: "text-emerald-500" },
  alertCircle: { Icon: AlertCircle, color: "text-amber-500" },
  calendar: { Icon: Calendar, color: "text-blue-500" },
};

interface TradingCalendarDailyStat {
  date: string;
  pnl: number;
  wins: number;
  losses: number;
}

interface DashboardStats {
  balance: number;
  monthlyReturn: number;
  winRate: number;
  profitFactor: number;
  avgRiskReward: number;
  streak: number;
}

interface DashboardInsight {
  id: string;
  kind: "positive" | "warning" | "neutral";
  title: string;
  description: string;
  icon: InsightIcon;
}

interface ReviewTradeRow {
  id: string;
  symbol: string;
  type: "Long" | "Short";
  date: string;
  reason: string;
  reviewed: boolean;
  pnl: number;
  tradeDate: string;
}

interface TradingPlanKpis {
  adherencePct: number;
  violations7d: number;
  avgRiskPerTradePct7d: number;
  journalCompliancePct: number;
}

interface ActiveTradingPlanSummary {
  name: string;
  version: string;
  kpis: TradingPlanKpis;
}

const DEMO_TRADING_PLAN = {
  name: "Momentum Breakout + Retest (A-Setups Only)",
  version: "v1.0",
} as const;

const DEMO_TRADING_PLAN_KPIS: TradingPlanKpis = {
  adherencePct: 84,
  violations7d: 2,
  avgRiskPerTradePct7d: 0.78,
  journalCompliancePct: 92,
};

const PERFORMANCE_DAYS = 30;

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

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const slugifyUsername = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

interface ViewerProfile {
  email: string;
  publicUsername?: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export default function AdminDashboardPage() {
  const dataMode = useDataMode();
  const isLive = dataMode.effectiveMode === "live";
  const activeAccount = useActiveAccount();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");

  const viewerProfile = useQuery(
    api.viewer.queries.getViewerProfile,
    shouldQuery ? {} : "skip",
  ) as ViewerProfile | null | undefined;

  const onboarding = useOnboardingStatus();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [openTradeId, setOpenTradeId] = React.useState<string | null>(null);
  const selectedTradeDate = useTradingCalendarStore(
    (state) => state.selectedDate,
  );
  const setSelectedTradeDate = useTradingCalendarStore(
    (state) => state.setSelectedDate,
  );
  React.useEffect(() => {
    setOpenTradeId(null);
  }, [selectedTradeDate]);

  const accountStateRaw = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerAccountState,
    shouldQuery && isLive ? {} : "skip",
  ) as unknown;

  const analyticsSummary = useQuery(
    api.traderlaunchpad.queries.getMyTradeIdeaAnalyticsSummary,
    shouldQuery && isLive
      ? { limit: 200, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as
    | {
      sampleSize: number;
      closedTrades: number;
      openTrades: number;
      winRate: number; // 0..1
      avgWin: number;
      avgLoss: number;
      expectancy: number;
      totalFees: number;
      totalPnl: number;
    }
    | undefined;

  const recentClosed = useQuery(
    api.traderlaunchpad.queries.listMyRecentClosedTradeIdeas,
    shouldQuery && isLive
      ? { limit: 200, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as
    | {
      tradeIdeaGroupId: string;
      symbol: string;
      direction: "long" | "short";
      closedAt: number;
      realizedPnl?: number;
      reviewStatus: "todo" | "reviewed";
    }[]
    | undefined;

  const liveCalendarDailyStats = useQuery(
    api.traderlaunchpad.queries.listMyCalendarDailyStats,
    shouldQuery && isLive
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
    shouldQuery && isLive
      ? { daysBack: 90, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as
    | {
      externalEventId: string;
      tradeIdeaGroupId?: string;
      externalPositionId: string;
      symbol: string | null;
      direction: "long" | "short" | null;
      closedAt: number;
      realizedPnl: number;
      qtyClosed?: number;
    }[]
    | undefined;

  const orgAggregateSummaryLive = useQuery(
    api.traderlaunchpad.queries.getOrgTradeIdeaAnalyticsSummary,
    shouldQuery && isLive && isOrgMode
      ? {
        organizationId: tenant?._id,
        limitPerUser: 200,
        maxMembers: 100,
        accountId: activeAccount.selected?.accountId,
      }
      : "skip",
  ) as
    | {
      sampleSize: number;
      closedTrades: number;
      openTrades: number;
      totalFees: number;
      totalPnl: number;
      memberCountTotal: number;
      memberCountConsidered: number;
      isTruncated: boolean;
    }
    | null
    | undefined;

  const orgAggregateSummary = isLive
    ? orgAggregateSummaryLive
    : (demoOrgAggregateTradeIdeaAnalyticsSummary as unknown as {
      sampleSize: number;
      closedTrades: number;
      openTrades: number;
      totalFees: number;
      totalPnl: number;
      memberCountTotal: number;
      memberCountConsidered: number;
      isTruncated: boolean;
    });

  const liveReviewTrades: ReviewTradeRow[] = React.useMemo(() => {
    const rows = Array.isArray(recentClosed) ? recentClosed : [];
    return rows
      .filter((r) => typeof r.tradeIdeaGroupId === "string" && r.tradeIdeaGroupId)
      .map((r) => {
        const pnl = typeof r.realizedPnl === "number" ? r.realizedPnl : 0;
        return {
          id: r.tradeIdeaGroupId,
          symbol: r.symbol,
          type: r.direction === "short" ? "Short" : "Long",
          date: toDateLabel(r.closedAt),
          reason: r.reviewStatus === "reviewed" ? "Reviewed" : "Pending review",
          reviewed: r.reviewStatus === "reviewed",
          pnl,
          tradeDate: toDateKey(r.closedAt),
        };
      });
  }, [recentClosed]);

  const reviewTrades: ReviewTradeRow[] = isLive
    ? liveReviewTrades
    : (demoReviewTrades as unknown as ReviewTradeRow[]);

  // Note: avgPnl previously shown in a removed card.

  const calendarDailyStats: TradingCalendarDailyStat[] = React.useMemo(() => {
    if (!isLive) return demoCalendarDailyStats as unknown as TradingCalendarDailyStat[];
    return Array.isArray(liveCalendarDailyStats)
      ? (liveCalendarDailyStats as unknown as TradingCalendarDailyStat[])
      : [];
  }, [isLive, liveCalendarDailyStats]);

  const streak = React.useMemo(() => {
    return isLive ? computeStreakFromDailyStats(calendarDailyStats) : demoDashboardStats.streak;
  }, [calendarDailyStats, isLive]);

  const balance = React.useMemo(() => {
    if (!isLive) return demoDashboardStats.balance;
    if (!accountStateRaw || typeof accountStateRaw !== "object") return 0;
    const rec = accountStateRaw as Record<string, unknown>;
    const raw = isRecord(rec.raw) ? rec.raw : null;
    if (!raw) return 0;
    return (
      toNumber(raw.equity) ??
      toNumber(raw.balance) ??
      toNumber(raw.accountBalance) ??
      toNumber(raw.account_equity) ??
      toNumber(raw.account_balance) ??
      0
    );
  }, [accountStateRaw, isLive]);

  const winRatePct = React.useMemo(() => {
    if (!isLive) return demoDashboardStats.winRate;
    const winRate = typeof analyticsSummary?.winRate === "number" ? analyticsSummary.winRate : 0;
    return Math.round(Math.max(0, Math.min(1, winRate)) * 100);
  }, [analyticsSummary?.winRate, isLive]);

  const profitFactor = React.useMemo(() => {
    if (!isLive) return demoDashboardStats.profitFactor;
    const pnls = reviewTrades.map((t) => t.pnl).filter((n) => Number.isFinite(n));
    const grossProfit = pnls.filter((n) => n > 0).reduce((a, b) => a + b, 0);
    const grossLossAbs = Math.abs(pnls.filter((n) => n < 0).reduce((a, b) => a + b, 0));
    if (grossLossAbs <= 0) return grossProfit > 0 ? 9.99 : 0;
    const pf = grossProfit / grossLossAbs;
    return Number.isFinite(pf) ? Math.round(pf * 100) / 100 : 0;
  }, [isLive, reviewTrades]);

  const monthlyReturnPct = React.useMemo(() => {
    if (!isLive) return demoDashboardStats.monthlyReturn;
    const totalPnl = typeof analyticsSummary?.totalPnl === "number" ? analyticsSummary.totalPnl : 0;
    if (!balance) return 0;
    return Math.round((totalPnl / Math.max(1, balance)) * 1000) / 10; // 0.1% precision
  }, [analyticsSummary?.totalPnl, balance, isLive]);

  const dashboardStats: DashboardStats = React.useMemo(
    () =>
      isLive
        ? {
          balance,
          monthlyReturn: monthlyReturnPct,
          winRate: winRatePct,
          profitFactor,
          avgRiskReward: demoDashboardStats.avgRiskReward,
          streak,
        }
        : (demoDashboardStats as unknown as DashboardStats),
    [balance, isLive, monthlyReturnPct, profitFactor, streak, winRatePct],
  );

  const performanceSeries = React.useMemo(() => {
    // Use calendar daily stats as the source of truth for plotting.
    // We chart an "equity curve" using current balance as an anchor and daily PnL deltas.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (PERFORMANCE_DAYS - 1));
    const cutoffKey = formatDate(cutoff, "yyyy-MM-dd");

    const rows = calendarDailyStats
      .filter((s) => typeof s.date === "string" && s.date >= cutoffKey)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!rows.length) return [];

    const periodPnl = rows.reduce((acc, r) => acc + (Number.isFinite(r.pnl) ? r.pnl : 0), 0);
    const startingEquity = dashboardStats.balance - periodPnl;

    let cumulativePnl = 0;
    return rows.map((r) => {
      const pnl = Number.isFinite(r.pnl) ? r.pnl : 0;
      cumulativePnl += pnl;

      const d = new Date(`${r.date}T00:00:00`);
      const label = Number.isNaN(d.getTime()) ? r.date : formatDate(d, "MMM d");

      return {
        date: r.date,
        label,
        equity: Math.round((startingEquity + cumulativePnl) * 100) / 100,
        pnl,
      };
    });
  }, [calendarDailyStats, dashboardStats.balance]);

  const performanceChartConfig = React.useMemo(
    () =>
      ({
        // TraderLaunchpad theme defines --chart-* as full `oklch(...)` values, so don't wrap in hsl().
        equity: { label: "Equity", color: "var(--chart-1)" },
      }) satisfies ChartConfig,
    [],
  );

  const insights: DashboardInsight[] = React.useMemo(() => {
    if (!isLive) return demoInsights as unknown as DashboardInsight[];

    const out: DashboardInsight[] = [];
    if (dashboardStats.winRate >= 60) {
      out.push({
        id: "insight-winrate",
        kind: "positive",
        title: "Strong win rate",
        description: `You’re winning ${dashboardStats.winRate}% of your recent closed trades.`,
        icon: "trendingUp",
      });
    } else if (dashboardStats.winRate > 0) {
      out.push({
        id: "insight-winrate",
        kind: "neutral",
        title: "Win rate baseline",
        description: `Current win rate: ${dashboardStats.winRate}%. Keep journaling to improve edge.`,
        icon: "calendar",
      });
    }

    if (dashboardStats.profitFactor >= 2) {
      out.push({
        id: "insight-pf",
        kind: "positive",
        title: "Profit factor looks great",
        description: `Profit factor is ${dashboardStats.profitFactor}. Nice risk/reward discipline.`,
        icon: "trendingUp",
      });
    } else if (dashboardStats.profitFactor > 0 && dashboardStats.profitFactor < 1) {
      out.push({
        id: "insight-pf",
        kind: "warning",
        title: "Losses outweigh wins",
        description:
          "Your recent gross losses outweigh profits. Review entries and sizing on losing setups.",
        icon: "alertCircle",
      });
    }

    // Only show streak insight once the user actually has activity.
    if (dashboardStats.streak > 0) {
      out.push({
        id: "insight-streak",
        kind: "neutral",
        title: "Journal streak",
        description: `You have a ${dashboardStats.streak}-day streak of trading activity (based on closed trades).`,
        icon: "calendar",
      });
    }

    return out.slice(0, 3);
  }, [dashboardStats.profitFactor, dashboardStats.streak, dashboardStats.winRate, isLive]);

  const tradingPlanKpis: TradingPlanKpis = React.useMemo(() => {
    // In demo mode, show demo KPIs.
    if (!isLive) return DEMO_TRADING_PLAN_KPIS;
    // In live mode, these KPIs should come from the active trading plan.
    // If no plan exists, show zeros to match /admin/tradingplan “Create your first plan”.
    return {
      adherencePct: 0,
      violations7d: 0,
      avgRiskPerTradePct7d: 0,
      journalCompliancePct: 0,
    };
  }, [isLive]);

  const activeTradingPlan = useQuery(
    api.traderlaunchpad.queries.getMyActiveTradingPlan,
    shouldQuery && isLive ? {} : "skip",
  ) as ActiveTradingPlanSummary | null | undefined;

  const tradingPlanSummary: ActiveTradingPlanSummary | null = React.useMemo(() => {
    if (!isLive) {
      return {
        name: DEMO_TRADING_PLAN.name,
        version: DEMO_TRADING_PLAN.version,
        kpis: DEMO_TRADING_PLAN_KPIS,
      };
    }
    if (!activeTradingPlan) return null;
    return {
      name: String(activeTradingPlan.name ?? "Untitled"),
      version: String(activeTradingPlan.version ?? "v1.0"),
      kpis: activeTradingPlan.kpis ?? {
        adherencePct: 0,
        violations7d: 0,
        avgRiskPerTradePct7d: 0,
        journalCompliancePct: 0,
      },
    };
  }, [activeTradingPlan, isLive]);

  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const [syncingNow, setSyncingNow] = React.useState(false);

  const handleSyncAccount = async () => {
    if (!isLive) {
      console.log("sync account (mock)");
      return;
    }
    setSyncingNow(true);
    try {
      await syncNow({});
    } finally {
      setSyncingNow(false);
    }
  };

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

  const calendarTradeIdeaIdByEventId = React.useMemo(() => {
    const map = new Map<string, string>();
    const rows = Array.isArray(liveCalendarEvents) ? liveCalendarEvents : [];
    for (const r of rows) {
      const eventId = String(r.externalEventId ?? "").trim();
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
    if (!isLive) {
      return reviewTrades.map((t) => ({
        id: t.id,
        tradeDate: t.tradeDate,
        symbol: t.symbol,
        type: t.type,
        reviewed: t.reviewed,
        reason: t.reason,
        pnl: t.pnl,
      }));
    }

    const rows = Array.isArray(liveCalendarEvents)
      ? (liveCalendarEvents as unknown as any[])
      : [];
    return rows.map((e) => {
      const closedAtMs = typeof e.closedAt === "number" ? e.closedAt : 0;
      const tradeDate = toDateKey(closedAtMs);
      const qtyClosed =
        typeof e.qtyClosed === "number" && Number.isFinite(e.qtyClosed) && e.qtyClosed !== 0
          ? e.qtyClosed
          : null;
      const qtyLabel = qtyClosed !== null ? ` • ${Math.abs(qtyClosed)}` : "";
      return {
        id: String(e.externalEventId ?? `${e.externalPositionId}:${e.closedAt}`),
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
  }, [isLive, liveCalendarEvents, reviewTrades]);

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
    <div className="relative animate-in fade-in space-y-8 text-foreground selection:bg-orange-500/30 duration-500">
      {!isDismissed && !onboarding.isComplete ? (
        <div className="rounded-2xl border border-orange-500/20 bg-white/80 px-4 py-2 text-foreground backdrop-blur-md dark:bg-black/45 dark:text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground dark:text-white">
                Finish setup
              </div>
              <div className="text-[11px] text-muted-foreground dark:text-white/60 tabular-nums">
                {onboarding.completedSteps}/{onboarding.totalSteps} completed
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/40 bg-white/70 text-foreground/70 hover:bg-white hover:text-foreground dark:border-white/10 dark:bg-black/40 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                onClick={handleDismiss}
                aria-label="Dismiss setup prompt"
              >
                <X className="h-4 w-4" />
              </button>
              <Link
                href={onboarding.nextStepHref ?? "/admin/onboarding/connect"}
                className="rounded-full bg-orange-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-orange-700"
              >
                Continue
              </Link>
            </div>
          </div>
          <div className="mt-2">
            <Progress
              value={Math.round(
                (onboarding.completedSteps / onboarding.totalSteps) * 100,
              )}
              className="h-1.5"
            />
          </div>
        </div>
      ) : null}
      <PublicProfileHeader
        coverUrl={viewerProfile?.coverUrl ?? null}
        avatarUrl={viewerProfile?.avatarUrl ?? null}
        avatarAlt={viewerProfile?.name ?? "User"}
        avatarFallback={(viewerProfile?.name ?? viewerProfile?.email ?? "U").slice(0, 1)}
        badgeLabel="Dashboard"
        title={
          viewerProfile?.name?.trim()
            ? viewerProfile.name
            : (viewerProfile?.email?.split("@")[0] ?? "Dashboard")
        }
        handle={`@${slugifyUsername(
          viewerProfile?.publicUsername ??
          viewerProfile?.name ??
          (viewerProfile?.email?.split("@")[0] ?? "me"),
        ) || "me"}`}
        bio={
          viewerProfile?.bio?.trim()
            ? viewerProfile.bio
            : "Your performance, insights, and reviews — synced with your trading calendar."
        }
        topRightExtra={null}
        actions={
          <Button
            className="gap-2 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => void handleSyncAccount()}
            disabled={syncingNow}
          >
            <Activity className="h-4 w-4" />
            {syncingNow ? "Syncing..." : "Sync Account"}
          </Button>
        }
      />

      {isOrgMode ? (
        <Card className="border-border/40 bg-card/60 dark:bg-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Organization performance</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-white/60">
              {isLive
                ? "Group totals across members in this organization."
                : "Demo org totals (100 members) for previews/testing."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgAggregateSummary === undefined ? (
              <div className="text-muted-foreground text-sm">Loading organization metrics…</div>
            ) : orgAggregateSummary === null ? (
              <div className="text-muted-foreground text-sm">
                You don’t have access to organization totals.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/40 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-muted-foreground text-xs">Total PnL (group)</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {Number.isFinite(orgAggregateSummary.totalPnl)
                      ? orgAggregateSummary.totalPnl.toFixed(2)
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-border/40 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-muted-foreground text-xs">Open trades (group)</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {Number.isFinite(orgAggregateSummary.openTrades)
                      ? orgAggregateSummary.openTrades
                      : "—"}
                  </div>
                </div>
                {orgAggregateSummary.isTruncated ? (
                  <div className="sm:col-span-2 text-muted-foreground text-xs">
                    Showing totals for {orgAggregateSummary.memberCountConsidered} of{" "}
                    {orgAggregateSummary.memberCountTotal} members (truncated for performance).
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Setup prompt moved into header (top-right). */}



      {/* Date filter (moved down; syncs with TradingCalendarPanel) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <ActiveAccountSelector className="w-full sm:w-auto" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-border/60 dark:bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground"
              >
                <Calendar className="h-4 w-4" />
                <span>{selectedDateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-border/40 bg-white/95 p-0 text-foreground dark:bg-black/70 dark:text-white">
              <DayCalendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleSelectDate}
                initialFocus
              />
              <div className="flex items-center justify-between border-t border-border/40 p-2 dark:border-white/10">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
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
            <Badge variant="outline" className="border-border/60 text-muted-foreground dark:text-white/70">
              All data
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <TradingCalendarWithDrilldown
            dailyStats={calendarDailyStats}
            trades={calendarTrades}
            selectedDate={selectedTradeDate}
            onSelectDateAction={setSelectedTradeDate}
            getTradeHrefAction={getCalendarTradeHref}
          />
        </div>
        <div className="space-y-8 lg:col-span-1">
          <Card className="min-h-[530px] h-full border-l-4 border-border/40 border-l-orange-500 bg-card/70 shadow-lg shadow-orange-500/5 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-orange-300" />
                  Trades
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-orange-500/10 ml-auto text-orange-700 hover:bg-orange-500/20 dark:text-orange-300"
                >
                  {selectedTradeDate ? "Filtered" : "All"}
                </Badge>
                <TooltipIcon
                  title="Trades List"
                  description="Shows trades filtered by the selected calendar date with review status."
                />
              </div>

            </CardHeader>
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {(selectedTradeDate
                  ? reviewTrades.filter((trade) => trade.tradeDate === selectedTradeDate)
                  : reviewTrades
                ).map((trade) => (
                  <Popover
                    key={trade.id}
                    open={openTradeId === trade.id}
                    onOpenChange={(next) =>
                      setOpenTradeId(next ? trade.id : null)
                    }
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
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] border-border/40 bg-white/95 p-3 text-foreground backdrop-blur dark:border-white/10 dark:bg-black/80 dark:text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            {trade.symbol} • {trade.type}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground dark:text-white/60">
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
                            "border-border/60 text-[10px]",
                            trade.reviewed
                              ? "text-emerald-700 dark:text-emerald-200"
                              : "text-amber-700 dark:text-amber-200",
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
                              isLive
                                ? `/admin/tradeideas/${encodeURIComponent(trade.id)}`
                                : `/admin/trade/${trade.id}`
                            }
                          >
                            View Trade{" "}
                            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-border/60 bg-transparent text-xs text-foreground hover:bg-foreground/5 hover:text-foreground dark:border-white/15 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                asChild
              >
                <Link href="/admin/tradeideas?status=closed">
                  View All Pending
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-2 gap-2 relative overflow-hidden border-l-4 border-border/40 border-l-emerald-500 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
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
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base font-bold leading-none tabular-nums sm:text-lg">
              ${dashboardStats.balance.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-0.5 hidden text-[11px] leading-tight sm:block">
              <span className="font-medium text-emerald-500">
                +{dashboardStats.monthlyReturn}%
              </span>{" "}
              this month
            </p>
          </CardContent>
        </Card>

        <Card className="p-2 gap-2 border-l-4 border-border/40 border-l-orange-500 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
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
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base font-bold leading-none tabular-nums sm:text-lg">
              {dashboardStats.winRate}%
            </div>
            <Progress
              value={dashboardStats.winRate}
              className="mt-1.5 h-1.5 bg-blue-100 dark:bg-blue-950"
            />
          </CardContent>
        </Card>

        <Card className="p-2 gap-2 border-l-4 border-border/40 border-l-orange-500 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
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
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base font-bold leading-none tabular-nums sm:text-lg">
              {dashboardStats.profitFactor}
            </div>
            <p className="text-muted-foreground mt-0.5 hidden text-[11px] leading-tight sm:block">
              Target: 2.0+{" "}
              <span className="ml-1 font-medium text-amber-500">
                (Excellent)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="p-2 gap-2 border-l-4 border-border/40 border-l-purple-500 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
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
          <CardContent className="p-2 pt-0 sm:p-3 sm:pt-0">
            <div className="text-base font-bold leading-none tabular-nums sm:text-lg">
              {dashboardStats.streak} Days
            </div>
            <p className="text-muted-foreground mt-0.5 hidden text-[11px] leading-tight sm:block">
              Keep it up! Consistency is key.
            </p>
          </CardContent>
        </Card>
      </div>





      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Charts & Insights (2/3 width) */}

        <div className="space-y-8 lg:col-span-2">
          {/* KPI Grid */}

          {/* Equity Curve Placeholder */}
          <Card className="border-border/40 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Your equity curve over the last {PERFORMANCE_DAYS} days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceSeries.length ? (
                <ChartContainer config={performanceChartConfig} className="h-[300px] w-full">
                  <LineChart data={performanceSeries} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={60}
                      tickFormatter={(v) => {
                        const n = typeof v === "number" ? v : Number(v);
                        if (!Number.isFinite(n)) return "";
                        return `$${Math.round(n).toLocaleString()}`;
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            const n = typeof value === "number" ? value : Number(value);
                            const label = name === "equity" ? "Equity" : String(name);
                            return (
                              <div className="flex w-full items-center justify-between gap-3">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium tabular-nums">
                                  {Number.isFinite(n) ? `$${n.toFixed(2)}` : "—"}
                                </span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="var(--color-equity)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-border/40 bg-linear-to-b from-orange-500/10 to-transparent px-6 text-center text-sm text-muted-foreground dark:border-white/10 dark:text-white/70">
                  No trades yet. As you start trading, we’ll plot your equity curve here.
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="border-border/40 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-300" />
                <CardTitle>Trading Coach Insights</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground dark:text-white/60">
                AI-driven analysis of your recent behavior and performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {insights.length ? (
                insights.map((insight) => {
                  const meta = INSIGHT_ICON[insight.icon];
                  const Icon = meta.Icon;
                  return (
                    <div
                      key={insight.id}
                      className="flex items-start gap-4 rounded-lg border border-border/40 bg-card/60 p-4 transition-colors hover:bg-card/70 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6"
                    >
                      <div
                        className={cn(
                          "rounded-full border border-border/40 bg-white/70 p-2 shadow-sm dark:border-white/10 dark:bg-black/30",
                          meta.color,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{insight.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-white/70">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-border/40 bg-card/60 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                  As you start trading AI will start giving AI suggestions.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Recent (1/3 width) */}
        <div className="space-y-8">

          {/* Trading Plan Summary */}
          <Card className="border-border/40 bg-card/70 backdrop-blur-md transition-colors hover:bg-card/80 dark:border-white/10 dark:bg-white/3 dark:hover:bg-white/6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-orange-300" />
                  Trading Plan
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 dark:text-orange-300"
                >
                  {(tradingPlanSummary?.kpis.adherencePct ?? tradingPlanKpis.adherencePct)}% adherence
                </Badge>
              </div>
              <CardDescription className="text-foreground/60">
                Monitor rules, risk, and consistency (separate from platform dashboard).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border/40 bg-background/70 p-3">
                {tradingPlanSummary ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">Plan</span>
                      <span className="font-semibold text-foreground/90">
                        {tradingPlanSummary.version}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-foreground">
                      {tradingPlanSummary.name}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-foreground/60">
                      <div className="rounded-md border border-border/40 bg-card/60 p-2 dark:border-white/10 dark:bg-white/3">
                        <div className="text-foreground/60">Violations (7d)</div>
                        <div className="mt-1 font-semibold text-foreground/90 tabular-nums">
                          {tradingPlanSummary.kpis.violations7d}
                        </div>
                      </div>
                      <div className="rounded-md border border-border/40 bg-card/60 p-2 dark:border-white/10 dark:bg-white/3">
                        <div className="text-foreground/60">Avg risk</div>
                        <div className="mt-1 font-semibold text-foreground/90 tabular-nums">
                          {tradingPlanSummary.kpis.avgRiskPerTradePct7d}%
                        </div>
                      </div>
                      <div className="rounded-md border border-border/40 bg-card/60 p-2 dark:border-white/10 dark:bg-white/3">
                        <div className="text-foreground/60">Journal</div>
                        <div className="mt-1 font-semibold text-foreground/90 tabular-nums">
                          {tradingPlanSummary.kpis.journalCompliancePct}%
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-foreground/70">
                    You don’t have a trading plan yet. Create your first plan to start tracking
                    consistency.
                  </div>
                )}
              </div>

              <Button
                asChild
                className="w-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              >
                <Link href="/admin/tradingplan">
                  {tradingPlanSummary ? "Open Trading Plan" : "Create Trading Plan"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
