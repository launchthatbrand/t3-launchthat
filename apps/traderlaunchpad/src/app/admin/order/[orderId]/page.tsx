"use client";

import { ArrowLeft, Calendar, Clock, DollarSign, Hash, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { NotesSection } from "~/components/admin/NotesSection";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { TraderLaunchpadOrderDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";
import { TradingChartCard } from "~/components/charts/TradingChartCard";
import { api } from "@convex-config/_generated/api";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

const isLikelyConvexId = (id: string) => {
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("mock-")) return false;
  return /^[a-z0-9]{20,}$/.test(trimmed);
};

function MockOrderDetail(props: { orderId: string }) {
  const short = props.orderId.replace(/^mock-ord-/, "").toUpperCase();
  // Simple deterministic toggle based on ID char code
  const isBuy = props.orderId.charCodeAt(props.orderId.length - 1) % 2 !== 0;
  const symbol = isBuy ? "EURUSD" : "NAS100";
  const pnl = isBuy ? 450.0 : -120.5;
  const nowSec = Math.floor(Date.now() / 1000);
  const markerTime = nowSec - 60 * 15 * 40; // within the generated candle range
  const orderMarker = {
    time: markerTime,
    position: (isBuy ? "belowBar" : "aboveBar") as const,
    color: isBuy ? "#10B981" : "#F43F5E",
    shape: (isBuy ? "arrowUp" : "arrowDown") as const,
    text: isBuy ? "Buy" : "Sell",
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">
                Order {short ? `#${short}` : ""}
              </h1>
              <Badge variant="outline" className="font-mono text-xs">
                {props.orderId}
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-0">
                Filled
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>Jan 16, 2024</span>
              <span className="text-muted-foreground/40">•</span>
              <Clock className="h-3.5 w-3.5" />
              <span>10:30 AM</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Download Ticket</Button>
          <Button>Edit Order</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Chart & Stats */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Symbol</div>
                <div className="mt-1 text-lg font-bold">{symbol}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Side</div>
                <div
                  className={`mt-1 text-lg font-bold ${isBuy ? "text-emerald-500" : "text-rose-500"
                    }`}
                >
                  {isBuy ? "Buy" : "Sell"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Size</div>
                <div className="mt-1 text-lg font-bold">1.00</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">
                  Realized P&L
                </div>
                <div
                  className={`mt-1 text-lg font-bold ${pnl >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                >
                  {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <TradingChartCard
            title="Price Action"
            symbol={symbol}
            height={400}
            markers={[orderMarker]}
            timeframes={["15m", "1h", "4h"]}
          />

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">Execution Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Order Type</span>
                  <span className="font-medium">Market</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Fill Price</span>
                  <span className="font-medium font-mono">1.08502</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Slippage</span>
                  <span className="font-medium text-rose-500">-0.2 pips</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-medium">$7.00</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Swap</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-muted-foreground">Ticket ID</span>
                  <span className="font-medium font-mono text-xs">#{props.orderId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Notes & Meta */}
        <div className="space-y-6">
          <NotesSection
            entityId={props.orderId}
            entityLabel={`Order ${short}`}
            className="border-white/10 bg-white/3 backdrop-blur-md"
            initialNotes={[
              {
                id: "mock-note-1",
                content: "Entry executed perfectly at the VWAP retest.",
                timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
                entityId: props.orderId,
                entityLabel: `Order ${short}`
              }
            ]}
          />

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Linked Trade Idea
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="border-white/10 bg-white/5">mock-1</Badge>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="font-medium text-sm">AUDJPY Breakout Strategy</div>
                <Button variant="link" asChild className="h-auto p-0 mt-2 text-xs text-orange-200 hover:text-orange-100">
                  <Link href="/admin/tradeideas/mock-1">View Trade Idea →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const dataMode = useDataMode();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";
  const kindParam = searchParams.get("kind");
  const kind =
    kindParam === "history" || kindParam === "order" ? kindParam : undefined;

  if (!orderId) {
    return (
      <div className="text-muted-foreground text-sm">Missing order id.</div>
    );
  }

  // Guard: when demo mode is OFF, mock routes should not resolve.
  React.useEffect(() => {
    if (!orderId) return;
    if (dataMode.effectiveMode !== "demo" && orderId.startsWith("mock-")) {
      router.replace("/admin/orders");
    }
  }, [dataMode.effectiveMode, orderId, router]);

  if (dataMode.effectiveMode !== "demo" && orderId.startsWith("mock-")) {
    return (
      <div className="text-muted-foreground text-sm">
        Redirecting…
      </div>
    );
  }

  if (!isLikelyConvexId(orderId)) {
    return <MockOrderDetail orderId={orderId} />;
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

      <TraderLaunchpadOrderDetailPage
        api={{
          queries: api.traderlaunchpad.queries,
          mutations: api.traderlaunchpad.mutations,
          actions: api.traderlaunchpad.actions,
        }}
        orderId={orderId}
        kind={kind}
        backHref="/admin/orders"
      />
    </div>
  );
}
