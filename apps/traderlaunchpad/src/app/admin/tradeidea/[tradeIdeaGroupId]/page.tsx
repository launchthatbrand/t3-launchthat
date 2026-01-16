"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TraderLaunchpadTradeIdeaDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { TradingChartMock } from "~/components/charts/TradingChartMock";
import { api } from "../../../../../convex/_generated/api";

const isLikelyConvexId = (id: string) => {
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("mock-")) return false;
  return /^[a-z0-9]{20,}$/.test(trimmed);
};

function MockTradeIdeaDetail(props: { tradeIdeaGroupId: string }) {
  const mockNumber = props.tradeIdeaGroupId.replace(/^mock-/, "");

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/admin/tradeideas">Back to TradeIdeas</Link>
        </Button>
        <div className="text-lg font-semibold">TradeIdea (Preview)</div>
        <Badge variant="outline">mock</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Mock TradeIdea #{mockNumber || "—"}</span>
            <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
              Needs Review
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>Chart (Preview)</span>
                <Badge variant="outline">15m</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-black p-2">
              <TradingChartMock symbol="AUDJPY" height={340} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Symbol</div>
              <div className="mt-1 text-lg font-semibold">AUDJPY</div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Outcome</div>
              <div className="mt-1 text-lg font-semibold text-emerald-500">
                +$450
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Setup</div>
              <div className="mt-1 text-lg font-semibold">Breakout</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Review (Preview)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                <div className="bg-background rounded-md border p-3">
                  Thesis: Wait for 5m structure break + retest.
                </div>
                <div className="bg-background rounded-md border p-3">
                  Mistake: Entered early on first spike.
                </div>
                <div className="bg-background rounded-md border p-3">
                  Next time: Size down unless A+ conditions.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Timeline (Preview)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                <div className="space-y-3">
                  <div className="bg-background flex items-center justify-between rounded-md border p-3">
                    <span>Entry</span>
                    <span className="font-mono">09:41</span>
                  </div>
                  <div className="bg-background flex items-center justify-between rounded-md border p-3">
                    <span>Add</span>
                    <span className="font-mono">09:44</span>
                  </div>
                  <div className="bg-background flex items-center justify-between rounded-md border p-3">
                    <span>Exit</span>
                    <span className="font-mono">10:02</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-muted-foreground text-xs">
            This is a UI preview. Real TradeIdea details will appear when you
            open a TradeIdea with a real Convex id.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminTradeIdeaDetailRoute() {
  const params = useParams<{ tradeIdeaGroupId?: string | string[] }>();
  const raw = params?.tradeIdeaGroupId;
  const tradeIdeaGroupId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  if (!isLikelyConvexId(tradeIdeaGroupId)) {
    return <MockTradeIdeaDetail tradeIdeaGroupId={tradeIdeaGroupId} />;
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Chart (Mock)</span>
            <Badge variant="outline">15m</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-black p-2">
          <TradingChartMock symbol="MARKET" height={360} />
        </CardContent>
      </Card>

      <TraderLaunchpadTradeIdeaDetailPage
        api={{
          queries: api.traderlaunchpad.queries,
          mutations: api.traderlaunchpad.mutations,
          actions: api.traderlaunchpad.actions,
        }}
        tradeIdeaGroupId={tradeIdeaGroupId}
      />
    </div>
  );
}
