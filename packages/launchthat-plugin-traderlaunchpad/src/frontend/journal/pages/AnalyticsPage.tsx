"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";

import type { TraderLaunchpadApiAdapter } from "../TraderLaunchpadAccountTab";
import { formatAge } from "../TraderLaunchpadAccountTab";

type ByInstrumentRow = {
  instrumentId: string;
  symbol: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  lastOpenedAt: number;
};

const byInstrumentColumns: ColumnDefinition<ByInstrumentRow>[] = [
  {
    id: "symbol",
    header: "Symbol",
    accessorKey: "symbol",
    cell: (row: ByInstrumentRow) => (
      <Link
        className="text-blue-600 hover:underline"
        href={`/admin/symbol/${encodeURIComponent(row.instrumentId)}`}
      >
        {row.symbol}
      </Link>
    ),
  },
  { id: "trades", header: "Trades", accessorKey: "trades" },
  {
    id: "winRate",
    header: "Win rate",
    accessorKey: "winRate",
    cell: (row: ByInstrumentRow) => `${Math.round((row.winRate ?? 0) * 100)}%`,
  },
  {
    id: "totalPnl",
    header: "Total P&L",
    accessorKey: "totalPnl",
    cell: (row: ByInstrumentRow) =>
      Number.isFinite(row.totalPnl) ? row.totalPnl.toFixed(2) : "—",
  },
  {
    id: "avgPnl",
    header: "Avg P&L",
    accessorKey: "avgPnl",
    cell: (row: ByInstrumentRow) =>
      Number.isFinite(row.avgPnl) ? row.avgPnl.toFixed(2) : "—",
  },
  {
    id: "lastOpenedAt",
    header: "Last trade",
    accessorKey: "lastOpenedAt",
    cell: (row: ByInstrumentRow) =>
      typeof row.lastOpenedAt === "number" ? formatAge(row.lastOpenedAt) : "—",
  },
];

export function TraderLaunchpadAnalyticsPage(props: {
  api: TraderLaunchpadApiAdapter;
}) {
  const tlQueries = props.api.queries;

  const summary = useQuery(tlQueries.getMyTradeIdeaAnalyticsSummary, {
    limit: 200,
  }) as
    | {
        sampleSize: number;
        closedTrades: number;
        openTrades: number;
        winRate: number;
        avgWin: number;
        avgLoss: number;
        expectancy: number;
        totalFees: number;
        totalPnl: number;
      }
    | undefined;

  const byInstrument = useQuery(
    tlQueries.listMyTradeIdeaAnalyticsByInstrument,
    {
      limit: 25,
    },
  ) as ByInstrumentRow[] | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold">Analytics</div>
        <Badge variant="outline">v1</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Closed trades</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.closedTrades : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open trades</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.openTrades : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Win rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? `${Math.round(summary.winRate * 100)}%` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total P&L</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.totalPnl.toFixed(2) : "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By symbol</CardTitle>
        </CardHeader>
        <CardContent>
          {byInstrument === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : byInstrument.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No closed trades yet.
            </div>
          ) : (
            <EntityList<ByInstrumentRow>
              data={byInstrument as any}
              columns={byInstrumentColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
