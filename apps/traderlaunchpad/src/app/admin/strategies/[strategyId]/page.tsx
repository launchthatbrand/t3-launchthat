"use client";

import * as React from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { api } from "@convex-config/_generated/api";
import { useTenant } from "~/context/TenantContext";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

interface TradingPlanSession {
  id: string;
  label: string;
  timezone: string;
  days: string[];
  start: string;
  end: string;
}

interface TradingPlanRule {
  id: string;
  title: string;
  description: string;
  category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
  severity: "hard" | "soft";
}

interface StrategyView {
  _id: string;
  name: string;
  version: string;
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

export default function AdminStrategyDetailPage() {
  const tenant = useTenant();
  const params = useParams();
  const rawStrategyId = (params as Record<string, unknown>).strategyId;
  const strategyId =
    typeof rawStrategyId === "string"
      ? rawStrategyId
      : Array.isArray(rawStrategyId) && typeof rawStrategyId[0] === "string"
        ? rawStrategyId[0]
        : "";

  const dataMode = useDataMode();
  const isLive = dataMode.effectiveMode === "live";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading && isLive;

  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");
  const orgId = isOrgMode && tenant ? tenant._id : null;

  const personalStrategy = useQuery(
    api.traderlaunchpad.queries.getMyStrategy,
    shouldQuery && !isOrgMode ? { strategyId } : "skip",
  ) as StrategyView | null | undefined;

  const orgStrategy = useQuery(
    api.traderlaunchpad.queries.getOrgStrategy,
    shouldQuery && orgId ? { organizationId: orgId, strategyId } : "skip",
  ) as StrategyView | null | undefined;

  const strategy = isOrgMode ? orgStrategy : personalStrategy;

  const setActive = useMutation(api.traderlaunchpad.mutations.setMyActiveStrategy);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link href="/admin/strategies" className="hover:underline">
              Strategies
            </Link>
            <span className="mx-2">/</span>
            <span className="font-mono">{strategyId}</span>
          </div>
          <h1 className="text-2xl font-semibold">Strategy</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/strategies">Back</Link>
        </Button>
      </div>

      {!shouldQuery ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
        </Card>
      ) : !strategy ? (
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This strategy is not available yet (or you’re not entitled to view it).
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>
                  {strategy.name} <span className="text-muted-foreground">({strategy.version})</span>
                </span>
                {!isOrgMode ? (
                  <Button
                    onClick={async () => {
                      await setActive({ strategyId: strategy._id });
                    }}
                  >
                    Set active
                  </Button>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">{strategy.strategySummary}</div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="text-sm font-semibold">Markets</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    {strategy.markets.map((m) => (
                      <span key={m} className="rounded-md bg-muted px-2 py-1">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm font-semibold">Risk</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Max risk/trade</div>
                    <div className="text-right">{strategy.risk.maxRiskPerTradePct}%</div>
                    <div>Max trades/day</div>
                    <div className="text-right">{strategy.risk.maxTradesPerDay}</div>
                    <div>Max open positions</div>
                    <div className="text-right">{strategy.risk.maxOpenPositions}</div>
                    <div>Max daily loss</div>
                    <div className="text-right">{strategy.risk.maxDailyLossPct}%</div>
                    <div>Max weekly loss</div>
                    <div className="text-right">{strategy.risk.maxWeeklyLossPct}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

