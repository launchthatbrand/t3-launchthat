"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Shield,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@acme/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@acme/ui/dropdown-menu";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { Progress } from "@acme/ui/progress";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { demoReviewTrades } from "@acme/demo-data";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

interface TradingPlanRule {
  id: string;
  title: string;
  description: string;
  category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
  severity: "hard" | "soft";
}

interface TradingPlanSession {
  id: string;
  label: string;
  timezone: string;
  days: string[];
  start: string;
  end: string;
}

interface TradingPlan {
  _id: string;
  name: string;
  version: string;
  createdAt: number;
  strategySummary: string;
  markets: string[];
  sessions: TradingPlanSession[];
  risk: {
    maxRiskPerTradePct: number;
    maxDailyLossPct: number;
    maxWeeklyLossPct: number;
    maxOpenPositions: number;
    maxTradesPerDay: number;
  };
  rules: TradingPlanRule[];
  kpis: {
    adherencePct: number;
    sessionDisciplinePct7d: number;
    avgRiskPerTradePct7d: number;
    journalCompliancePct: number;
    violations7d: number;
  };
}

interface TradingPlanListRow {
  _id: string;
  name: string;
  version: string;
  archivedAt?: number;
  createdAt: number;
  updatedAt: number;
}

const DEMO_PLAN: TradingPlan = {
  _id: "demo-plan",
  name: "Momentum Breakout + Retest (A-Setups Only)",
  version: "v1.0",
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  strategySummary:
    "Trade only the cleanest momentum breakouts and disciplined retests. Prioritize structure, pre-defined risk, and consistent journaling over frequency.",
  markets: ["ES", "NQ", "CL"],
  sessions: [
    {
      id: "newyork",
      label: "New York",
      timezone: "America/New_York",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      start: "09:30",
      end: "11:30",
    },
  ],
  risk: {
    maxRiskPerTradePct: 1,
    maxDailyLossPct: 3,
    maxWeeklyLossPct: 6,
    maxOpenPositions: 2,
    maxTradesPerDay: 3,
  },
  rules: [
    {
      id: "entry-1",
      title: "Trade only A+ setups",
      description: "If you wouldn’t take it live on max size, don’t take it at all.",
      category: "Entry",
      severity: "hard",
    },
    {
      id: "risk-1",
      title: "Size risk before entry",
      description: "Risk is defined at entry. No moving stops wider.",
      category: "Risk",
      severity: "hard",
    },
    {
      id: "process-1",
      title: "Journal every closed trade",
      description: "No exceptions. Review within 24 hours.",
      category: "Process",
      severity: "soft",
    },
  ],
  kpis: {
    adherencePct: 84,
    sessionDisciplinePct7d: 88,
    avgRiskPerTradePct7d: 0.78,
    journalCompliancePct: 92,
    violations7d: 2,
  },
};

interface TradingPlanViolation {
  id: string;
  ruleTitle: string;
  date: string;
  severity: "hard" | "soft";
  note?: string;
  tradeId?: string;
}

const DEMO_VIOLATIONS: TradingPlanViolation[] = [
  {
    id: "v-1",
    ruleTitle: "Trade only A+ setups",
    date: "Jan 12",
    severity: "hard",
    note: "Took a low-quality late entry after missing the initial move.",
    tradeId: "mock-001",
  },
  {
    id: "v-2",
    ruleTitle: "Size risk before entry",
    date: "Jan 16",
    severity: "soft",
    note: "Adjusted stop without recalculating size (minor).",
    tradeId: "mock-002",
  },
];

const toneForCategory: Record<
  TradingPlanRule["category"],
  string
> = {
  Entry: "bg-sky-500/10 text-sky-200 border-sky-500/20",
  Risk: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  Exit: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  Process: "bg-violet-500/10 text-violet-200 border-violet-500/20",
  Psychology: "bg-orange-500/10 text-orange-200 border-orange-500/20",
};

export default function AdminTradingPlanPage() {
  const dataMode = useDataMode();
  const isLive = dataMode.effectiveMode === "live";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const plans = useQuery(
    api.traderlaunchpad.queries.listMyTradingPlans,
    shouldQuery && isLive ? {} : "skip",
  ) as TradingPlanListRow[] | undefined;

  const activePlan = useQuery(
    api.traderlaunchpad.queries.getMyActiveTradingPlan,
    shouldQuery && isLive ? {} : "skip",
  ) as TradingPlan | null | undefined;

  const recentClosed = useQuery(
    api.traderlaunchpad.queries.listMyRecentClosedTradeIdeas,
    shouldQuery && isLive ? { limit: 200 } : "skip",
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

  const createPlan = useMutation(api.traderlaunchpad.mutations.createMyTradingPlanFromTemplate);
  const setActive = useMutation(api.traderlaunchpad.mutations.setMyActiveTradingPlan);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newPlanName, setNewPlanName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const effectivePlan: TradingPlan | null = isLive ? (activePlan ?? null) : DEMO_PLAN;
  const [range, setRange] = React.useState<"7d" | "30d">("7d");

  const liveTradeStats = React.useMemo(() => {
    const rows = Array.isArray(recentClosed) ? recentClosed : [];
    const pnl = rows.reduce((sum, t) => sum + (typeof t.realizedPnl === "number" ? t.realizedPnl : 0), 0);
    const wins = rows.filter((t) => (typeof t.realizedPnl === "number" ? t.realizedPnl : 0) > 0).length;
    const losses = rows.filter((t) => (typeof t.realizedPnl === "number" ? t.realizedPnl : 0) < 0).length;
    const reviewed = rows.filter((t) => t.reviewStatus === "reviewed").length;
    const total = rows.length;
    const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return { pnl, wins, losses, reviewed, total, reviewRate };
  }, [recentClosed]);

  const handleCreateFirstPlan = async () => {
    if (!isLive) return;
    setCreating(true);
    try {
      const name = newPlanName.trim();
      await createPlan({ name: name ? name : undefined });
      setNewPlanName("");
      setCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!isLive) return;
    await setActive({ planId });
  };

  const stats = React.useMemo(() => {
    const plan = effectivePlan;
    if (!plan) {
      return {
        adherencePct: 0,
        sessionDisciplinePct: 0,
        avgRiskPct: 0,
        journalCompliancePct: 0,
        violations: 0,
        reviewRate: 0,
        pnl: 0,
        wins: 0,
        losses: 0,
      };
    }

    // Demo uses demoReviewTrades. Live uses recent closed trade-ideas + reviewStatus.
    const reviewed = isLive ? liveTradeStats.reviewed : demoReviewTrades.filter((t) => t.reviewed).length;
    const total = isLive ? liveTradeStats.total : demoReviewTrades.length;
    const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    const pnl = isLive ? liveTradeStats.pnl : demoReviewTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = isLive ? liveTradeStats.wins : demoReviewTrades.filter((t) => t.pnl > 0).length;
    const losses = isLive ? liveTradeStats.losses : demoReviewTrades.filter((t) => t.pnl < 0).length;

    return {
      adherencePct: isLive ? reviewRate : plan.kpis.adherencePct,
      sessionDisciplinePct: plan.kpis.sessionDisciplinePct7d,
      avgRiskPct: plan.kpis.avgRiskPerTradePct7d,
      journalCompliancePct: isLive ? reviewRate : plan.kpis.journalCompliancePct,
      violations: plan.kpis.violations7d,
      reviewRate,
      pnl,
      wins,
      losses,
    };
  }, [effectivePlan, isLive, liveTradeStats]);

  if (isLive && shouldQuery && plans && plans.length === 0) {
    return (
      <div className="relative animate-in fade-in space-y-6 text-white selection:bg-orange-500/30 duration-500">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Trading Plan</h1>
            <p className="mt-1 text-white/60">
              You don’t have a trading plan yet. Create your first plan to start tracking consistency.
            </p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Create your first trading plan</CardTitle>
            <CardDescription className="text-white/60">
              Start with a solid default template and refine it over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full space-y-2">
              <Label htmlFor="planName" className="text-white/70">
                Plan name (optional)
              </Label>
              <Input
                id="planName"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="e.g. ES Breakout + Retest"
                className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              className="border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => void handleCreateFirstPlan()}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create plan"}
            </Button>
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
          <Link href="/admin/dashboard">
            Back to platform dashboard <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const plan = effectivePlan;
  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 text-white">
        <div className="text-sm text-white/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Page header (separate from main platform dashboard) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Trading Plan</h1>
          <p className="mt-1 text-white/60">
            Monitor your rules, risk, and consistency — separate from the platform dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLive && plans && plans.length > 0 ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 gap-2 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <span className="max-w-[220px] truncate">Active: {plan.name}</span>
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 border-white/10 bg-black/90 text-white">
                  {plans.map((p) => {
                    const isActive = p._id === plan._id;
                    return (
                      <DropdownMenuItem
                        key={p._id}
                        className="cursor-pointer"
                        onSelect={() => void handleSelectPlan(p._id)}
                      >
                        <span className="mr-2 w-4 shrink-0 text-center text-white/80">
                          {isActive ? "✓" : ""}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{p.name}</div>
                          <div className="truncate text-xs text-white/60">{p.version}</div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-orange-300 focus:text-orange-300"
                    onSelect={() => setCreateOpen(true)}
                  >
                    Create new plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="border-white/10 bg-black/90 text-white">
                  <DialogHeader>
                    <DialogTitle>Create a new trading plan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="newPlanName" className="text-white/70">
                      Plan name (optional)
                    </Label>
                    <Input
                      id="newPlanName"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="e.g. NQ Trend Pullback"
                      className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="border-0 bg-orange-600 text-white hover:bg-orange-700"
                      onClick={() => void handleCreateFirstPlan()}
                      disabled={creating}
                    >
                      {creating ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : null}

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-8 rounded-full px-3 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                range === "7d" && "bg-white/10 text-white",
              )}
              onClick={() => setRange("7d")}
            >
              Last 7d
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-8 rounded-full px-3 text-xs text-white/70 hover:bg-white/10 hover:text-white",
                range === "30d" && "bg-white/10 text-white",
              )}
              onClick={() => setRange("30d")}
            >
              Last 30d
            </Button>
          </div>

          <Button className="gap-2 border-0 bg-orange-600 text-white hover:bg-orange-700">
            <Brain className="h-4 w-4" />
            Generate AI plan insights (coming)
          </Button>
        </div>
      </div>

      {/* Plan overview */}
      <Card className="border-white/10 bg-white/3 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription className="text-white/60">
                {plan.version} • Created {new Date(plan.createdAt).toLocaleDateString()} •{" "}
                {range === "7d" ? "Monitoring last 7 days" : "Monitoring last 30 days"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                <Target className="mr-1 h-3.5 w-3.5 text-orange-300" />
                {plan.markets.length} markets
              </Badge>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                <Clock className="mr-1 h-3.5 w-3.5 text-orange-300" />
                {plan.sessions.length} sessions
              </Badge>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-white/80">
                <Shield className="mr-1 h-3.5 w-3.5 text-orange-300" />
                {plan.risk.maxRiskPerTradePct}% max risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="text-sm font-semibold">Strategy Summary</div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{plan.strategySummary}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {plan.markets.map((m) => (
                <Badge key={m} variant="outline" className="border-white/10 bg-white/5 text-white/75">
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Adherence</div>
                <div className="text-sm font-bold">{stats.adherencePct}%</div>
              </div>
              <Progress value={stats.adherencePct} className="mt-2 h-2" />
              <div className="mt-2 text-xs text-white/60">
                Based on plan rules + recent behavior (mock).
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Violations</div>
                <div className="text-sm font-bold">{stats.violations}</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                {range === "7d"
                  ? "Last 7 days"
                  : "Last 30 days (mock; will be real later)"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-white/60">Journal compliance</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{stats.journalCompliancePct}%</div>
            <div className="mt-2 text-[11px] text-white/50">Goal: 90%+</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-white/60">Session discipline</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{stats.sessionDisciplinePct}%</div>
            <div className="mt-2 text-[11px] text-white/50">Stay inside your sessions</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-white/60">Avg risk / trade (7d)</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{stats.avgRiskPct}%</div>
            <div className="mt-2 text-[11px] text-white/50">Max: {plan.risk.maxRiskPerTradePct}%</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-white/60">Review completion</div>
            <div className="mt-1 text-lg font-bold tabular-nums">{stats.reviewRate}%</div>
            <div className="mt-2 text-[11px] text-white/50">Reviewed trades in journal</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Rules & risk */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-orange-300" />
                <CardTitle>Rules (monitoring)</CardTitle>
              </div>
              <CardDescription className="text-white/60">
                These are the constraints your AI Strategy Builder will later help you create and refine.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {plan.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-lg border border-white/10 bg-white/3 p-4 transition-colors hover:bg-white/6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold">{rule.title}</div>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", toneForCategory[rule.category])}
                        >
                          {rule.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs border-white/15",
                            rule.severity === "hard"
                              ? "bg-rose-500/10 text-rose-200"
                              : "bg-white/5 text-white/70",
                          )}
                        >
                          {rule.severity === "hard" ? "Hard rule" : "Soft rule"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-white/70">{rule.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-300" />
                <CardTitle>Risk Guardrails</CardTitle>
              </div>
              <CardDescription className="text-white/60">
                The “hard stops” that keep you in the game.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="text-xs font-medium text-white/60">Max risk / trade</div>
                <div className="mt-1 text-lg font-bold tabular-nums">
                  {plan.risk.maxRiskPerTradePct}%
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="text-xs font-medium text-white/60">Max daily loss</div>
                <div className="mt-1 text-lg font-bold tabular-nums">
                  {plan.risk.maxDailyLossPct}%
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="text-xs font-medium text-white/60">Max weekly loss</div>
                <div className="mt-1 text-lg font-bold tabular-nums">
                  {plan.risk.maxWeeklyLossPct}%
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="text-xs font-medium text-white/60">Limits</div>
                <div className="mt-1 text-sm text-white/80">
                  <span className="font-semibold">{plan.risk.maxOpenPositions}</span> open positions •{" "}
                  <span className="font-semibold">{plan.risk.maxTradesPerDay}</span> trades/day
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-8">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-orange-300" />
                  Trading Sessions
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-300 hover:bg-orange-500/20">
                  {stats.sessionDisciplinePct}%
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                Where you’re allowed to execute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.sessions.map((s) => (
                <div key={s.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-white/60">{s.timezone}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    {s.days.join(", ")} • {s.start}–{s.end}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-orange-300" />
                  Recent Violations
                </CardTitle>
                <Badge variant="secondary" className="bg-white/5 text-white/70 hover:bg-white/10">
                  {isLive ? 0 : DEMO_VIOLATIONS.length}
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                What to correct before scaling size.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(isLive ? [] : DEMO_VIOLATIONS).map((v) => (
                <div key={v.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{v.ruleTitle}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {v.date} • {v.severity === "hard" ? "Hard" : "Soft"}
                      </div>
                      {v.note ? (
                        <div className="mt-2 text-xs text-white/70">{v.note}</div>
                      ) : null}
                    </div>
                    {v.tradeId ? (
                      <Button
                        asChild
                        variant="outline"
                        className="h-8 shrink-0 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link href={`/admin/trade/${encodeURIComponent(v.tradeId)}`}>
                          View
                          <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md transition-colors hover:bg-white/6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-300" />
                <CardTitle>AI Strategy Builder (coming)</CardTitle>
              </div>
              <CardDescription className="text-white/60">
                Next: onboarding + plan editor. This page will become your plan “control room”.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/70">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <div className="font-semibold text-white">What you’ll do here</div>
                  <div className="mt-1 text-white/70">
                    Choose a base plan, customize rules, and get AI suggestions based on violations + stats.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <div>
                  <div className="font-semibold text-white">How we’ll measure it</div>
                  <div className="mt-1 text-white/70">
                    Session adherence, risk sizing, journaling rate, and rule-level violations.
                  </div>
                </div>
              </div>

              <Button
                asChild
                className="mt-2 w-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              >
                <Link href="/admin/dashboard">
                  Back to platform dashboard <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

