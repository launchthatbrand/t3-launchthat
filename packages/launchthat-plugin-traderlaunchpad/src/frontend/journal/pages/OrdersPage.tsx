"use client";

import React from "react";
import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { TraderLaunchpadApiAdapter, TradeOrderRow, TradePositionRow, formatAge } from "../TraderLaunchpadAccountTab";

const ordersColumns: ColumnDefinition<TradeOrderRow>[] = [
  { id: "symbol", header: "Symbol", accessorKey: "symbol" },
  {
    id: "side",
    header: "Side",
    accessorKey: "side",
    cell: (item: TradeOrderRow) =>
      item.side === "buy" ? "Buy" : item.side === "sell" ? "Sell" : "—",
  },
  { id: "status", header: "Status", accessorKey: "status" },
  {
    id: "updatedAt",
    header: "Updated",
    accessorKey: "updatedAt",
    cell: (item: TradeOrderRow) =>
      typeof item.updatedAt === "number" ? formatAge(item.updatedAt) : "—",
  },
];

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

export function TraderLaunchpadOrdersPage(props: { api: TraderLaunchpadApiAdapter }) {
  const tlQueries = props.api.queries;

  const orders = useQuery(tlQueries.listMyTradeLockerOrders, { limit: 100 }) as
    | TradeOrderRow[]
    | undefined;

  const ordersHistory = useQuery(tlQueries.listMyTradeLockerOrdersHistory, {
    limit: 100,
  }) as TradeOrderRow[] | undefined;

  const positions = useQuery(tlQueries.listMyTradeLockerPositions, {
    limit: 100,
  }) as TradePositionRow[] | undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Open positions</CardTitle>
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
              data={positions as any}
              columns={positionsColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-muted-foreground text-sm">No orders.</div>
          ) : (
            <EntityList<TradeOrderRow>
              data={orders as any}
              columns={ordersColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersHistory === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : ordersHistory.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No order history yet.
            </div>
          ) : (
            <EntityList<TradeOrderRow>
              data={ordersHistory as any}
              columns={ordersColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
