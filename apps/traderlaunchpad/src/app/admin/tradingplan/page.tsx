"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Shield,
  Target,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { cn } from "@acme/ui";
import { demoReviewTrades, demoTradingPlan, demoTradingPlanViolations } from "@acme/demo-data";

const toneForCategory: Record<
  (typeof demoTradingPlan.rules)[number]["category"],
  string
> = {
  Entry: "bg-sky-500/10 text-sky-200 border-sky-500/20",
  Risk: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  Exit: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  Process: "bg-violet-500/10 text-violet-200 border-violet-500/20",
  Psychology: "bg-orange-500/10 text-orange-200 border-orange-500/20",
};

export default function AdminTradingPlanPage() {
  const plan = demoTradingPlan;
  const [range, setRange] = React.useState<"7d" | "30d">("7d");

  const stats = React.useMemo(() => {
    // Mock “monitoring” derived from demoReviewTrades + plan KPIs.
    // Later: wire to real user data + violations engine.
    const reviewed = demoReviewTrades.filter((t) => t.reviewed).length;
    const total = demoReviewTrades.length;
    const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    const pnl = demoReviewTrades.reduce((sum, t) => sum + t.pnl, 0);
    const wins = demoReviewTrades.filter((t) => t.pnl > 0).length;
    const losses = demoReviewTrades.filter((t) => t.pnl < 0).length;

    return {
      adherencePct: plan.kpis.adherencePct,
      sessionDisciplinePct: plan.kpis.sessionDisciplinePct7d,
      avgRiskPct: plan.kpis.avgRiskPerTradePct7d,
      journalCompliancePct: plan.kpis.journalCompliancePct,
      violations: plan.kpis.violations7d,
      reviewRate,
      pnl,
      wins,
      losses,
    };
  }, [plan]);

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
            Generate AI plan insights (mock)
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
                  {demoTradingPlanViolations.length}
                </Badge>
              </div>
              <CardDescription className="text-white/60">
                What to correct before scaling size.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoTradingPlanViolations.map((v) => (
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

