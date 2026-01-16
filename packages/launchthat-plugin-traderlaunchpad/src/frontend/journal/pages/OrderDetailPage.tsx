"use client";

import React from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Separator } from "@acme/ui/separator";

import {
  formatAge,
  TradeExecutionRow,
  TradeOrderRow,
  TraderLaunchpadApiAdapter,
} from "../TraderLaunchpadAccountTab";

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
  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
    cell: (item: TradeExecutionRow) =>
      typeof item.qty === "number" ? item.qty : "—",
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    cell: (item: TradeExecutionRow) =>
      typeof item.price === "number" ? item.price : "—",
  },
  {
    id: "fees",
    header: "Fees",
    accessorKey: "fees",
    cell: (item: TradeExecutionRow) =>
      typeof item.fees === "number" ? item.fees : "—",
  },
];

type OrderDetailResult =
  | { kind: "order"; order: TradeOrderRow }
  | { kind: "history"; order: TradeOrderRow }
  | null;

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export function TraderLaunchpadOrderDetailPage(props: {
  api: TraderLaunchpadApiAdapter;
  orderId: string;
  kind?: "order" | "history";
  backHref?: string;
}) {
  const tlQueries = props.api.queries;
  const tlActions = props.api.actions;
  const detail = useQuery(tlQueries.getMyTradeLockerOrderDetail, {
    orderId: props.orderId,
    kind: props.kind,
  }) as OrderDetailResult | undefined;

  const order = detail?.order ?? null;
  const raw = ((order as any)?.raw ?? {}) as Record<string, unknown>;

  const [resolvedSymbolById, setResolvedSymbolById] = React.useState<
    Record<string, string>
  >({});
  const [isResolving, setIsResolving] = React.useState(false);
  const inFlightRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const resolveInstrument = useAction(
    tlActions.getMyTradeLockerInstrumentDetails,
  );

  const executions = useQuery(tlQueries.listMyTradeLockerExecutionsForOrder, {
    externalOrderId: order?.externalOrderId ?? "",
    limit: 200,
  }) as TradeExecutionRow[] | undefined;

  const qty = readNumber((raw as any)?.qty ?? (raw as any)?.quantity);
  const price = readNumber((raw as any)?.price ?? (raw as any)?.avgPrice);

  const status = order?.status ?? "—";
  const side = order?.side ?? undefined;
  const instrumentId = (() => {
    const value = (order as any)?.instrumentId;
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value);
    return "";
  })();
  const instrumentIdDisplay = instrumentId || "—";
  const resolvedSymbol = instrumentId
    ? resolvedSymbolById[instrumentId]
    : undefined;
  const orderSymbol =
    typeof order?.symbol === "string" && order.symbol.trim()
      ? order.symbol.trim()
      : undefined;
  const rawSymbol =
    typeof raw?.symbol === "string" && raw.symbol.trim()
      ? raw.symbol.trim()
      : undefined;
  const symbol = resolvedSymbol ?? orderSymbol ?? rawSymbol;
  const showFetching = isResolving && !symbol;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    const run = async () => {
      if (!instrumentId || symbol) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setIsResolving(true);
      try {
        const result = (await resolveInstrument({
          instrumentId,
        })) as { symbol?: string } | null;
        // eslint-disable-next-line no-console
        console.log("[order_detail.instrument_lookup]", {
          instrumentId,
          result,
        });
        if (mountedRef.current && result?.symbol) {
          setResolvedSymbolById((prev) => ({
            ...prev,
            [instrumentId]: result.symbol!,
          }));
        }
      } finally {
        inFlightRef.current = false;
        if (mountedRef.current) setIsResolving(false);
      }
    };
    void run();
  }, [instrumentId, resolveInstrument, symbol]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href={props.backHref ?? "/admin/orders"}>Back to orders</Link>
        </Button>
        <div className="text-lg font-semibold">Order detail</div>
        <Badge variant="outline">{detail?.kind ?? "order"}</Badge>
        {side ? <Badge>{side === "buy" ? "Buy" : "Sell"}</Badge> : null}
        <Badge variant="secondary">{status}</Badge>
      </div>

      {!order ? (
        <div className="text-muted-foreground text-sm">Order not found.</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Symbol</div>
                <div>
                  {symbol && instrumentId ? (
                    <Link
                      href={`/admin/symbol/${encodeURIComponent(instrumentId)}`}
                      className="text-blue-600 hover:underline"
                    >
                      {symbol}
                    </Link>
                  ) : (
                    (symbol ?? "—")
                  )}
                  {showFetching ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      fetching…
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">External Order ID</div>
                <div className="break-all">{order.externalOrderId}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Instrument ID</div>
                <div className="break-all">{instrumentIdDisplay}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Quantity</div>
                <div>{qty ?? "—"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Price</div>
                <div>{price ?? "—"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Created</div>
                <div>
                  {typeof order.createdAt === "number"
                    ? formatAge(order.createdAt)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Closed</div>
                <div>
                  {typeof order.closedAt === "number"
                    ? formatAge(order.closedAt)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Last updated</div>
                <div>
                  {typeof order.updatedAt === "number"
                    ? formatAge(order.updatedAt)
                    : "—"}
                </div>
              </div>
            </CardContent>
          </Card>

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
                  enableSearch={false}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw data</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <pre className="bg-muted max-h-96 overflow-auto rounded-md p-3 text-xs">
                {JSON.stringify(order.raw ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
