"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { cn } from "@acme/ui";
import { TradingChartCard } from "~/components/charts/TradingChartCard";
import type { TradingChartMarker, TradingTimeframe } from "~/components/charts/TradingChartMock";

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const toChartTimeframe = (tf: string): TradingTimeframe => {
  const v = String(tf ?? "").toLowerCase();
  if (v === "m5" || v === "5m") return "5m";
  if (v === "m15" || v === "15m") return "15m";
  if (v === "h1" || v === "1h") return "1h";
  if (v === "h4" || v === "4h") return "4h";
  if (v === "d1" || v === "1d") return "1d";
  return "15m";
};

export default function SharedTradeIdeaPage() {
  const params = useParams<{ shareToken?: string | string[] }>();
  const raw = params.shareToken;
  const shareTokenRaw = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const shareToken = String(shareTokenRaw).trim();

  const shared = useQuery(api.traderlaunchpad.public.getSharedTradeIdeaByToken, {
    shareToken,
  }) as
    | {
        tradeIdeaId: string;
        symbol: string;
        bias: "long" | "short" | "neutral";
        timeframe: string;
        timeframeLabel?: string;
        thesis?: string;
        tags?: string[];
        visibility: "private" | "link" | "public";
        status: "active" | "closed";
        openedAt: number;
        lastActivityAt: number;
        positions: Array<{
          tradeIdeaGroupId: string;
          symbol: string;
          direction: "long" | "short";
          status: "open" | "closed";
          openedAt: number;
          closedAt?: number;
          realizedPnl?: number;
        }>;
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
    return <div className="p-6 text-sm text-muted-foreground">Trade idea not found.</div>;
  }

  const netPnl = (shared.positions ?? []).reduce((acc, p) => acc + (p.realizedPnl ?? 0), 0);

  const markers: TradingChartMarker[] = (shared.positions ?? []).flatMap((p, idx) => {
    const isLong = p.direction === "long";
    const openMarker: TradingChartMarker = {
      time: p.openedAt,
      position: isLong ? "belowBar" : "aboveBar",
      color: isLong ? "#10B981" : "#F43F5E",
      shape: isLong ? "arrowUp" : "arrowDown",
      text: `Open ${idx + 1}`,
    };
    const closeMarker: TradingChartMarker | null =
      typeof p.closedAt === "number"
        ? {
            time: p.closedAt,
            position: "inBar",
            color: "rgba(255,255,255,0.6)",
            shape: "circle",
            text: "Close",
          }
        : null;
    return closeMarker ? [openMarker, closeMarker] : [openMarker];
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white selection:bg-orange-500/30">
      <div>
        <div className="text-sm text-white/55">Shared trade idea</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {shared.symbol}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "border-white/15",
              shared.bias === "long"
                ? "text-emerald-200"
                : shared.bias === "short"
                  ? "text-rose-200"
                  : "text-white/70",
            )}
          >
            {shared.bias === "long" ? "Long" : shared.bias === "short" ? "Short" : "Neutral"}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/70">
            {shared.timeframeLabel ?? shared.timeframe}
          </Badge>
          <Badge variant="outline" className="border-white/15 text-white/70">
            {shared.visibility === "public" ? "Public" : "Sharable"}
          </Badge>
        </div>
        <div className="mt-1 text-sm text-white/55">
          {toDateLabel(shared.openedAt)} • {shared.positions.length} positions •{" "}
          <span className={cn(netPnl >= 0 ? "text-emerald-200" : "text-rose-200")}>
            {netPnl >= 0 ? "+" : "-"}${Math.abs(netPnl).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TradingChartCard
            title="Price Action"
            symbol={shared.symbol}
            height={420}
            defaultTimeframe={toChartTimeframe(shared.timeframe)}
            timeframes={["15m", "1h", "4h"]}
            markers={markers}
          />

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-base">Thesis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-white/80">
              {shared.thesis ?? <span className="text-white/50">No thesis text.</span>}
              {Array.isArray(shared.tags) && shared.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {shared.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-white/5 text-white/60">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-base">Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(shared.positions ?? []).length === 0 ? (
                <div className="p-6 text-sm text-white/60">No positions.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {shared.positions.map((p) => (
                    <div key={p.tradeIdeaGroupId} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-white">{p.symbol}</div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px] border-white/15",
                              p.direction === "long" ? "text-emerald-200" : "text-rose-200",
                            )}
                          >
                            {p.direction === "long" ? "Long" : "Short"}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/5 text-white/60">
                            {p.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          Opened {toDateLabel(p.openedAt)}
                          {typeof p.closedAt === "number" ? ` • Closed ${toDateLabel(p.closedAt)}` : ""}
                        </div>
                      </div>
                      <div className={cn("text-sm tabular-nums", (p.realizedPnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200")}>
                        {(p.realizedPnl ?? 0) >= 0 ? "+" : "-"}${Math.abs(p.realizedPnl ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

