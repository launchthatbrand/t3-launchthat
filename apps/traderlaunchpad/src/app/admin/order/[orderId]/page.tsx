"use client";

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { TraderLaunchpadOrderDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { TradingChartMock } from "~/components/charts/TradingChartMock";

const isLikelyConvexId = (id: string) => {
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("mock-")) return false;
  return /^[a-z0-9]{20,}$/.test(trimmed);
};

function MockOrderDetail(props: { orderId: string }) {
  const short = props.orderId.replace(/^mock-ord-/, "").toUpperCase();

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
        <div className="text-lg font-semibold">Order (Preview)</div>
        <Badge variant="outline">mock</Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground font-mono text-sm">
                {short ? `ORD-${short}` : "ORD"}
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                Filled
              </Badge>
            </div>
            <div className="text-sm font-semibold text-emerald-500">
              +$450.00
            </div>
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
              <TradingChartMock symbol="EURUSD" height={340} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Symbol</div>
              <div className="mt-1 text-lg font-semibold">EURUSD</div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Side</div>
              <div className="mt-1 text-lg font-semibold text-emerald-500">
                Buy
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Qty</div>
              <div className="mt-1 text-lg font-semibold">1.00</div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="text-muted-foreground text-xs">Avg Fill</div>
              <div className="mt-1 text-lg font-semibold">1.0850</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Execution Summary (Preview)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3 text-sm">
                <div className="bg-background flex items-center justify-between rounded-md border p-3">
                  <span>Filled At</span>
                  <span className="font-mono">10:30 AM</span>
                </div>
                <div className="bg-background flex items-center justify-between rounded-md border p-3">
                  <span>Slippage</span>
                  <span className="font-mono">0.2 pips</span>
                </div>
                <div className="bg-background flex items-center justify-between rounded-md border p-3">
                  <span>Fees</span>
                  <span className="font-mono">$0.13</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes (Preview)</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                <div className="bg-background rounded-md border p-3">
                  Use this space to capture the “why”, the trigger, and whether
                  the entry matched your plan.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-muted-foreground text-xs">
            This is a UI preview. Real order details will appear when you open
            an order with a real Convex document id.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOrderDetailPage() {
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
