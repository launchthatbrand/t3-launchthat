"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TraderLaunchpadTradeIdeaDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";
import { ArrowLeft, ArrowUpRight, BarChart2, Calendar, Target } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import { TradingChartCard } from "~/components/charts/TradingChartCard";
import { NotesSection } from "~/components/admin/NotesSection";
import { api } from "@convex-config/_generated/api";
import { demoAdminOrders } from "@acme/demo-data";

const isLikelyConvexId = (id: string) => {
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("mock-")) return false;
  return /^[a-z0-9]{20,}$/.test(trimmed);
};

function MockTradeIdeaDetail(props: { tradeIdeaGroupId: string }) {
  const mockNumber = props.tradeIdeaGroupId.replace(/^mock-/, "");
  
  // Mock related orders
  const relatedOrders = [
    { id: "mock-ord-001", label: "Order #001 (EURUSD)" },
    { id: "mock-ord-002", label: "Order #002 (NAS100)" },
  ];
  interface AdminOrderLite {
    id: string;
    symbol: string;
    type: "Buy" | "Sell";
    role?: string;
  }

  const linkedOrders = (demoAdminOrders as unknown as AdminOrderLite[]).filter(
    (o) => relatedOrders.some((r) => r.id === o.id),
  );
  const nowSec = Math.floor(Date.now() / 1000);
  const ideaMarkers = linkedOrders.map((o, idx) => {
    const isBuy = o.type === "Buy";
    return {
      time: nowSec - 60 * 15 * (80 - idx * 18),
      position: (isBuy ? "belowBar" : "aboveBar") as const,
      color: isBuy ? "#10B981" : "#F43F5E",
      shape: (isBuy ? "arrowUp" : "arrowDown") as const,
      text: o.role ?? (isBuy ? "Buy" : "Sell"),
    };
  });

  return (
    <div className="animate-in fade-in space-y-6 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/tradeideas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">
                AUDJPY Breakout Strategy
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {props.tradeIdeaGroupId}
              </Badge>
              <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-0">
                Needs Review
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>Jan 16, 2024</span>
              <span className="text-muted-foreground/40">•</span>
              <Target className="h-3.5 w-3.5" />
              <span>Breakout Setup</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Mark Reviewed</Button>
          <Button>Edit Idea</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          <TradingChartCard
            title="Chart Analysis"
            symbol="AUDJPY"
            height={400}
            markers={ideaMarkers}
            timeframes={["15m", "1h", "4h"]}
            className="border-border/60 border-white/10"
          />

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Outcome</div>
                <div className="mt-1 text-lg font-bold text-emerald-500">+$450.00</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">R-Multiple</div>
                <div className="mt-1 text-lg font-bold">2.1R</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Win Rate</div>
                <div className="mt-1 text-lg font-bold">100%</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Trades</div>
                <div className="mt-1 text-lg font-bold">2</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base">Review Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Followed entry rules?",
                  "Sized correctly?",
                  "Managed trade according to plan?",
                  "Journaled emotions?",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded border border-primary/50" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base">Related Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/admin/order/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{order.label}</div>
                        <div className="text-xs text-muted-foreground">Filled • Jan 16</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Notes (Aggregated) */}
        <div className="space-y-6">
          <NotesSection 
            entityId={props.tradeIdeaGroupId} 
            entityLabel="Trade Idea"
            className="border-white/10 bg-white/3 backdrop-blur-md"
            relatedEntities={relatedOrders}
            initialNotes={[
              {
                id: "mock-note-ti-1",
                content: "This setup looks clean on the 4h timeframe. Waiting for retest.",
                timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
                entityId: props.tradeIdeaGroupId,
                entityLabel: "Trade Idea"
              },
              {
                id: "mock-note-ord-1",
                content: "Entry executed perfectly at the VWAP retest.",
                timestamp: Date.now() - 1000 * 60 * 60 * 2,
                entityId: "mock-ord-001",
                entityLabel: "Order #001 (EURUSD)"
              }
            ]}
          />
          
          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Breakout", "A+ Setup", "London Session", "Trend Following"].map((tag) => (
                  <Badge key={tag} variant="secondary" className="hover:bg-secondary/80 border-white/10 bg-white/5">
                    {tag}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="h-5 rounded-full text-xs px-2 border-white/20 hover:bg-white/10">
                  + Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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
