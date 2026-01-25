"use client";

import * as React from "react";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { TradingChartMarker, TradingTimeframe } from "~/components/charts/TradingChartMock";
import { useParams, useSearchParams } from "next/navigation";

import { AffiliatePageShell } from "~/components/affiliates/AffiliatePageShell";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { TradingChartCard } from "~/components/charts/TradingChartCard";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { useQuery } from "convex/react";

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

export default function PublicTradeIdeaDetailPage() {
  const params = useParams<{ username?: string; tradeIdeaId?: string }>();
  const search = useSearchParams();

  const username = decodeURIComponent(String(params.username ?? ""));
  const tradeIdeaId = decodeURIComponent(String(params.tradeIdeaId ?? ""));
  const code = search.get("code") ?? undefined;

  const shared = useQuery(api.traderlaunchpad.public.getPublicTradeIdea, {
    username,
    tradeIdeaId,
    code,
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

  const markers: TradingChartMarker[] = React.useMemo(() => {
    const positions = shared && Array.isArray(shared.positions) ? shared.positions : [];
    return positions.flatMap((p, idx) => {
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
  }, [shared]);

  return (

    <div className="relative min-h-screen text-white">
      <div className="container">
        {shared === undefined ? (
          <div className="p-6 text-sm text-white/60">Loading…</div>
        ) : !shared ? (
          <div className="p-6 text-sm text-white/60">Unauthorized or not found.</div>
        ) : (
          <div className="animate-in fade-in space-y-6 duration-500 pb-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href={`/u/${encodeURIComponent(username)}`}>
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Badge variant="outline" className="border-white/15 text-white/70">
                    {shared.visibility === "public" ? "Public" : "Shared"}
                  </Badge>
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
                  {shared.symbol} •{" "}
                  {shared.bias === "long"
                    ? "Long"
                    : shared.bias === "short"
                      ? "Short"
                      : "Neutral"}
                </h1>
                <p className="mt-1 text-sm text-white/60">
                  @{username} • {toDateLabel(shared.openedAt)} •{" "}
                  {shared.timeframeLabel ?? shared.timeframe}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button className="border-0 bg-orange-600 text-white hover:bg-orange-700" asChild>
                  <Link href={`/u/${encodeURIComponent(username)}/tradeideas`}>
                    All Trade ideas <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <TradingChartCard
                  title="Price Action"
                  symbol={shared.symbol}
                  height={400}
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
                          <div
                            key={p.tradeIdeaGroupId}
                            className="flex items-center justify-between gap-3 px-5 py-4"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-semibold text-white">{p.symbol}</div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-5 px-1.5 text-[10px] border-white/15",
                                    p.direction === "long"
                                      ? "text-emerald-200"
                                      : "text-rose-200",
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
                                {typeof p.closedAt === "number"
                                  ? ` • Closed ${toDateLabel(p.closedAt)}`
                                  : ""}
                              </div>
                            </div>
                            <div
                              className={cn(
                                "text-sm tabular-nums",
                                (p.realizedPnl ?? 0) >= 0
                                  ? "text-emerald-200"
                                  : "text-rose-200",
                              )}
                            >
                              {(p.realizedPnl ?? 0) >= 0 ? "+" : "-"}$
                              {Math.abs(p.realizedPnl ?? 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="h-24" />
          </div>
        )}
      </div>
    </div>

  );
}

