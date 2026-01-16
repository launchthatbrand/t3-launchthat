"use client";

import React from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Separator } from "@acme/ui/separator";

import type {
  TradeExecutionRow,
  TradeOrderRow,
  TraderLaunchpadApiAdapter,
} from "../TraderLaunchpadAccountTab";
import { formatAge } from "../TraderLaunchpadAccountTab";

type InstrumentDetails = { symbol?: string } | null;

const orderColumns: ColumnDefinition<TradeOrderRow>[] = [
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
  {
    id: "actions",
    header: "",
    cell: (item: TradeOrderRow) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/order/${item._id}`}>View</Link>
      </Button>
    ),
  },
];

const executionColumns: ColumnDefinition<TradeExecutionRow>[] = [
  {
    id: "executedAt",
    header: "Executed",
    accessorKey: "executedAt",
    cell: (item: TradeExecutionRow) =>
      typeof item.executedAt === "number" ? formatAge(item.executedAt) : "—",
  },
  {
    id: "side",
    header: "Side",
    accessorKey: "side",
    cell: (item: TradeExecutionRow) =>
      item.side === "buy" ? "Buy" : item.side === "sell" ? "Sell" : "—",
  },
  { id: "symbol", header: "Symbol", accessorKey: "symbol" },
  { id: "qty", header: "Qty", accessorKey: "qty" },
  { id: "price", header: "Price", accessorKey: "price" },
  { id: "fees", header: "Fees", accessorKey: "fees" },
];

export function TraderLaunchpadSymbolTradesPage(props: {
  api: TraderLaunchpadApiAdapter;
  instrumentId: string;
}) {
  const tlQueries = props.api.queries;
  const tlActions = props.api.actions;

  const instrumentId = props.instrumentId.trim();

  const [symbol, setSymbol] = React.useState<string | null>(null);
  const resolveInstrument = useAction(tlActions.getMyTradeLockerInstrumentDetails);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!instrumentId) return;
      try {
        const res = (await resolveInstrument({
          instrumentId,
        })) as InstrumentDetails;
        if (!cancelled) setSymbol(typeof res?.symbol === "string" ? res.symbol : null);
      } catch {
        if (!cancelled) setSymbol(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [instrumentId, resolveInstrument]);

  const orders = useQuery(tlQueries.listMyTradeLockerOrdersForInstrument, {
    instrumentId,
    limit: 200,
  }) as TradeOrderRow[] | undefined;

  const history = useQuery(tlQueries.listMyTradeLockerOrdersHistoryForInstrument, {
    instrumentId,
    limit: 200,
  }) as TradeOrderRow[] | undefined;

  const executions = useQuery(tlQueries.listMyTradeLockerExecutionsForInstrument, {
    instrumentId,
    limit: 500,
  }) as TradeExecutionRow[] | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
        <div className="text-lg font-semibold">Symbol trades</div>
        <Badge variant="outline">Instrument {instrumentId || "—"}</Badge>
        {symbol ? <Badge>{symbol}</Badge> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-muted-foreground text-sm">No orders found.</div>
          ) : (
            <EntityList<TradeOrderRow>
              data={orders as any}
              columns={orderColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {history === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : history.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No historical orders found.
            </div>
          ) : (
            <EntityList<TradeOrderRow>
              data={history as any}
              columns={orderColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {executions === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : executions.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No executions found.
            </div>
          ) : (
            <EntityList<TradeExecutionRow>
              data={executions as any}
              columns={executionColumns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

