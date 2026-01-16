"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { Separator } from "@acme/ui/separator";

import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";

// Mock Data for Design
const STATS = {
  balance: 12450.0,
  monthlyReturn: 12.5,
  winRate: 68,
  profitFactor: 2.4,
  avgRiskReward: 1.8,
  streak: 5,
};

const INSIGHTS = [
  {
    id: 1,
    type: "positive",
    title: "On Fire",
    description: "Your win rate on 'Breakout' setups is 80% this week.",
    icon: TrendingUp,
    color: "text-emerald-500",
  },
  {
    id: 2,
    type: "warning",
    title: "Oversizing Warning",
    description: "You risked >2% on your last 3 losing trades.",
    icon: AlertCircle,
    color: "text-amber-500",
  },
  {
    id: 3,
    type: "neutral",
    title: "Consistency",
    description: "You've journaled 100% of your trades for 5 days straight.",
    icon: Calendar,
    color: "text-blue-500",
  },
];

const RECENT_TRADES = [
  {
    id: "1",
    symbol: "EURUSD",
    type: "Long",
    result: "win",
    pnl: 450,
    date: "2h ago",
    strategy: "Trend Following",
  },
  {
    id: "2",
    symbol: "NQ1!",
    type: "Short",
    result: "loss",
    pnl: -180,
    date: "5h ago",
    strategy: "Mean Reversion",
  },
  {
    id: "3",
    symbol: "BTCUSD",
    type: "Long",
    result: "win",
    pnl: 1200,
    date: "1d ago",
    strategy: "Breakout",
  },
];

const PENDING_REVIEWS = [
  {
    id: "4",
    symbol: "AAPL",
    type: "Short",
    date: "Yesterday",
    reason: "Impulse entry?",
  },
  {
    id: "5",
    symbol: "XAUUSD",
    type: "Long",
    date: "Yesterday",
    reason: "Target missed",
  },
];

export default function AdminDashboardPage() {
  const onboarding = useOnboardingStatus();
  const [isDismissed, setIsDismissed] = React.useState(false);

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
    <div className="animate-in fade-in space-y-8 duration-500">
      {!isDismissed && !onboarding.isComplete ? (
        <Card className="relative overflow-hidden border-blue-500/20 bg-linear-to-br from-blue-500/10 to-transparent">
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
                  className="bg-blue-600 text-white hover:bg-blue-700"
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

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. You're trading well today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Jan 16, 2026</span>
          </Button>
          <Button className="gap-2 border-0 bg-blue-600 text-white hover:bg-blue-700">
            <Activity className="h-4 w-4" />
            Sync Account
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Account Balance
            </CardTitle>
            <span className="rounded-full bg-emerald-500/10 p-1 text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${STATS.balance.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              <span className="font-medium text-emerald-500">
                +{STATS.monthlyReturn}%
              </span>{" "}
              this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Win Rate
            </CardTitle>
            <Target className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.winRate}%</div>
            <Progress
              value={STATS.winRate}
              className="mt-2 h-1.5 bg-blue-100 dark:bg-blue-950"
            />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Profit Factor
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.profitFactor}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Target: 2.0+{" "}
              <span className="ml-1 font-medium text-amber-500">
                (Excellent)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Journal Streak
            </CardTitle>
            <Brain className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.streak} Days</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Keep it up! Consistency is key.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Charts & Insights (2/3 width) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Equity Curve Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Your equity curve over the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-border group relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-linear-to-b from-blue-500/5 to-transparent">
                <div className="text-muted-foreground/30 absolute inset-0 flex items-center justify-center font-medium">
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
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="from-background to-muted/30 bg-linear-to-br">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <CardTitle>Trading Coach Insights</CardTitle>
              </div>
              <CardDescription>
                AI-driven analysis of your recent behavior and performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {INSIGHTS.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-card/50 hover:bg-card/80 flex items-start gap-4 rounded-lg border p-4 transition-colors"
                >
                  <div
                    className={cn(
                      "bg-background rounded-full border p-2 shadow-sm",
                      insight.color,
                    )}
                  >
                    <insight.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions & Recent (1/3 width) */}
        <div className="space-y-8">
          {/* Review Queue */}
          <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Needs Review
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                >
                  {PENDING_REVIEWS.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {PENDING_REVIEWS.map((trade) => (
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
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {trade.date} • {trade.reason}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="mt-2 w-full text-xs" asChild>
                <Link href="/admin/tradeideas?status=closed">
                  View All Pending
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {RECENT_TRADES.map((trade, i) => (
                  <div
                    key={trade.id}
                    className="border-border relative border-l pb-6 pl-6 last:border-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        "ring-background absolute top-0 left-[-5px] h-2.5 w-2.5 rounded-full border ring-4",
                        trade.result === "win"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-red-500 bg-red-500",
                      )}
                    />
                    <div className="-mt-1.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {trade.symbol} {trade.type}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold",
                            trade.result === "win"
                              ? "text-emerald-500"
                              : "text-red-500",
                          )}
                        >
                          {trade.pnl > 0 ? "+" : ""}${trade.pnl}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>{trade.strategy}</span>
                        <span>{trade.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                className="flex h-auto flex-col items-center justify-center gap-1 py-3 text-xs"
                asChild
              >
                <Link href="/admin/journal">
                  <Calendar className="mb-1 h-4 w-4" />
                  Journal
                </Link>
              </Button>
              <Button
                variant="secondary"
                className="flex h-auto flex-col items-center justify-center gap-1 py-3 text-xs"
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
