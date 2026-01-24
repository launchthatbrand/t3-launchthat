"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@convex-config/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

const formatMoney = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
};

const formatPct = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return `${Math.round(v * 100)}%`;
};

export default function SharedAnalyticsReportPage() {
  const params = useParams();
  const shareTokenRaw =
    typeof params?.shareToken === "string"
      ? params.shareToken
      : Array.isArray(params?.shareToken)
        ? params.shareToken[0]
        : "";
  const shareToken = String(shareTokenRaw ?? "").trim();

  const shared = useQuery(api.traderlaunchpad.queries.getSharedAnalyticsReport, {
    shareToken,
  }) as unknown as
    | {
        name: string;
        result: {
          headline: {
            netPnl: number;
            realizedPnl: number;
            unrealizedPnl: number;
            winRate: number;
            profitFactor: number;
            totalFees: number;
          };
          bySymbol: Array<{ symbol: string; pnl: number; closeEventCount: number }>;
        };
      }
    | null
    | undefined;

  if (!shareToken) {
    return <div className="p-6 text-sm text-muted-foreground">Invalid link.</div>;
  }

  if (shared === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!shared) {
    return <div className="p-6 text-sm text-muted-foreground">Report not found.</div>;
  }

  const h = shared.result.headline;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <div className="text-sm text-muted-foreground">Shared analytics report</div>
        <h1 className="text-2xl font-bold tracking-tight">{shared.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(h.netPnl)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Realized {formatMoney(h.realizedPnl)} • Unrealized {formatMoney(h.unrealizedPnl)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Win rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatPct(h.winRate)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Profit factor {h.profitFactor.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{formatMoney(h.totalFees)}</div>
            <div className="mt-1 text-xs text-muted-foreground">From close events</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top symbols</CardTitle>
          <CardDescription>Best performers in this report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(shared.result.bySymbol ?? []).slice(0, 10).map((r, idx) => (
            <div key={`${r.symbol}-${idx}`} className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">{r.symbol}</div>
              <div className="tabular-nums">{formatMoney(r.pnl)}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

