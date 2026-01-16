"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";

import {
  formatAge,
  formatMs,
  TradePositionRow,
  TraderLaunchpadApiAdapter,
} from "../TraderLaunchpadAccountTab";

const positionsColumns: ColumnDefinition<TradePositionRow>[] = [
  { id: "symbol", header: "Symbol", accessorKey: "symbol" },
  {
    id: "side",
    header: "Side",
    accessorKey: "side",
    cell: (item: TradePositionRow) =>
      item.side === "buy" ? "Long" : item.side === "sell" ? "Short" : "—",
  },
  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
    cell: (item: TradePositionRow) =>
      typeof item.qty === "number" ? item.qty : "—",
  },
  {
    id: "avg",
    header: "Avg",
    accessorKey: "avgPrice",
    cell: (item: TradePositionRow) =>
      typeof item.avgPrice === "number" ? item.avgPrice : "—",
  },
];

type NextToReviewRow = {
  tradeIdeaGroupId: string;
  symbol: string;
  instrumentId?: string;
  direction: "long" | "short";
  closedAt: number;
  realizedPnl?: number;
  fees?: number;
  reviewStatus: "todo" | "reviewed";
  reviewedAt?: number;
  noteUpdatedAt?: number;
};

const tradeIdeasColumns: ColumnDefinition<NextToReviewRow>[] = [
  {
    id: "symbol",
    header: "Symbol",
    accessorKey: "symbol",
    cell: (row: NextToReviewRow) => (
      <Link
        className="text-blue-600 hover:underline"
        href={`/admin/tradeidea/${encodeURIComponent(row.tradeIdeaGroupId)}`}
      >
        {row.symbol}
      </Link>
    ),
  },
  {
    id: "direction",
    header: "Dir",
    accessorKey: "direction",
    cell: (row: NextToReviewRow) => (row.direction === "long" ? "Long" : "Short"),
  },
  {
    id: "closedAt",
    header: "Closed",
    accessorKey: "closedAt",
    cell: (row: NextToReviewRow) =>
      typeof row.closedAt === "number" ? formatAge(row.closedAt) : "—",
  },
  {
    id: "pnl",
    header: "P&L",
    accessorKey: "realizedPnl",
    cell: (row: NextToReviewRow) =>
      typeof row.realizedPnl === "number" ? row.realizedPnl.toFixed(2) : "—",
  },
  {
    id: "fees",
    header: "Fees",
    accessorKey: "fees",
    cell: (row: NextToReviewRow) =>
      typeof row.fees === "number" ? row.fees.toFixed(2) : "—",
  },
  {
    id: "actions",
    header: "",
    cell: (row: NextToReviewRow) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/tradeidea/${encodeURIComponent(row.tradeIdeaGroupId)}`}>Review</Link>
      </Button>
    ),
  },
];

export function TraderLaunchpadDashboardPage(props: {
  api: TraderLaunchpadApiAdapter;
}) {
  const tlQueries = props.api.queries;

  const connectionData = useQuery(tlQueries.getMyTradeLockerConnection, {}) as
    | {
        connection: any;
        polling: {
          now: number;
          intervalMs: number;
          lastSyncAt: number;
          nextSyncAt: number;
          isSyncing: boolean;
        };
      }
    | null
    | undefined;

  const positions = useQuery(tlQueries.listMyTradeLockerPositions, {
    limit: 100,
  }) as TradePositionRow[] | undefined;

  const analytics = useQuery(tlQueries.getMyTradeIdeaAnalyticsSummary, {
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

  const nextToReview = useQuery(tlQueries.listMyNextTradeIdeasToReview, {
    limit: 10,
  }) as NextToReviewRow[] | undefined;

  const status = connectionData?.connection?.status as
    | "connected"
    | "error"
    | "disconnected"
    | undefined;

  const lastSyncAt =
    typeof connectionData?.polling?.lastSyncAt === "number"
      ? connectionData.polling.lastSyncAt
      : 0;
  const nextSyncAt =
    typeof connectionData?.polling?.nextSyncAt === "number"
      ? connectionData.polling.nextSyncAt
      : 0;
  const intervalMs =
    typeof connectionData?.polling?.intervalMs === "number"
      ? connectionData.polling.intervalMs
      : 0;
  const isSyncing = Boolean(connectionData?.polling?.isSyncing);

  const syncLabel = React.useMemo(() => {
    if (!lastSyncAt || !intervalMs) return "—";
    const now = Date.now();
    const dueIn = nextSyncAt - now;
    if (isSyncing) return "Syncing now…";
    if (dueIn <= 0) return `Overdue by ${formatMs(Math.abs(dueIn))}`;
    return `Again in ${formatMs(dueIn)}`;
  }, [intervalMs, isSyncing, lastSyncAt, nextSyncAt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">TradeLocker</div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">Dashboard</div>
            {status ? (
              <Badge variant={status === "connected" ? "default" : "outline"}>
                {status}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/tradeideas?status=closed">Review trades</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/analytics">Analytics</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/settings">Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Closed TradeIdeas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {analytics ? analytics.closedTrades : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Win rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {analytics ? `${Math.round(analytics.winRate * 100)}%` : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total P&amp;L</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {analytics ? analytics.totalPnl.toFixed(2) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open TradeIdeas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {analytics ? analytics.openTrades : "—"}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <CardTitle className="text-base">Recent closed TradeIdeas</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/tradeideas?status=closed">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {nextToReview === undefined ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : nextToReview.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Nothing to review yet. Sync to import trades, then come back to review.
              </div>
            ) : (
              <EntityList<NextToReviewRow>
                data={nextToReview as any}
                columns={tradeIdeasColumns as any}
                viewModes={["list"]}
                enableSearch={false}
                enableFooter={false}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sync health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Last synced:</span>{" "}
              {lastSyncAt ? formatAge(lastSyncAt) : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Syncing:</span> {syncLabel}
            </div>
            <div>
              <span className="text-muted-foreground">Connected:</span>{" "}
              {status === "connected" ? "Yes" : "No"}
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings">Manage connection</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Open positions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {Array.isArray(positions) ? positions.length : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Connected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {status === "connected" ? "Yes" : "No"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Positions (preview)</CardTitle>
        </CardHeader>
        <CardContent>
          {positions === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : positions.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No open positions.
            </div>
          ) : (
            <EntityList<TradePositionRow>
              data={positions.slice(0, 5) as any}
              columns={positionsColumns as any}
              viewModes={["list"]}
              enableSearch={false}
              enableFooter={false}
            />
          )}
        </CardContent>
      </Card>

      {/* legacy block retained below */}
      <div className="hidden text-sm">
          <div>
            <span className="text-muted-foreground">Last synced:</span>{" "}
            {lastSyncAt ? formatAge(lastSyncAt) : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Syncing:</span> {syncLabel}
          </div>
      </div>
    </div>
  );
}
