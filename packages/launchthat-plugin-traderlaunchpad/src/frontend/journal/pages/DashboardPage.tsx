"use client";

import React from "react";
import { useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
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

        <div className="text-sm">
          <div>
            <span className="text-muted-foreground">Last synced:</span>{" "}
            {lastSyncAt ? formatAge(lastSyncAt) : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Syncing:</span> {syncLabel}
          </div>
        </div>
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
    </div>
  );
}
