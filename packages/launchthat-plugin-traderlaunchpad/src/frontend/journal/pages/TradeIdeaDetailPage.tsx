"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Separator } from "@acme/ui/separator";

import type { TraderLaunchpadApiAdapter } from "../TraderLaunchpadAccountTab";
import { formatAge } from "../TraderLaunchpadAccountTab";

type TradeIdea = Record<string, unknown> & {
  _id: string;
  status: "open" | "closed";
  symbol: string;
  instrumentId?: string;
  direction: "long" | "short";
  openedAt: number;
  closedAt?: number;
  netQty: number;
  avgEntryPrice?: number;
  realizedPnl?: number;
  fees?: number;
  lastExecutionAt?: number;
};

type TradeIdeaEvent = Record<string, unknown> & {
  _id: string;
  externalExecutionId: string;
  externalOrderId?: string;
  externalPositionId?: string;
  executedAt: number;
};

const eventColumns: ColumnDefinition<TradeIdeaEvent>[] = [
  {
    id: "executedAt",
    header: "Executed",
    accessorKey: "executedAt",
    cell: (row: TradeIdeaEvent) =>
      typeof row.executedAt === "number" ? formatAge(row.executedAt) : "—",
  },
  { id: "externalExecutionId", header: "Exec ID", accessorKey: "externalExecutionId" },
  { id: "externalOrderId", header: "Order", accessorKey: "externalOrderId" },
  { id: "externalPositionId", header: "Position", accessorKey: "externalPositionId" },
];

export function TraderLaunchpadTradeIdeaDetailPage(props: {
  api: TraderLaunchpadApiAdapter;
  tradeIdeaGroupId: string;
}) {
  const tlQueries = props.api.queries;

  const tradeIdea = useQuery(tlQueries.getMyTradeIdeaById, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
  }) as TradeIdea | null | undefined;

  const events = useQuery(tlQueries.listMyTradeIdeaEvents, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
    limit: 200,
  }) as TradeIdeaEvent[] | undefined;

  const symbol = tradeIdea?.symbol ?? "—";
  const instrumentId =
    typeof tradeIdea?.instrumentId === "string" ? tradeIdea.instrumentId : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" asChild>
          <Link href="/admin/tradeideas">Back to TradeIdeas</Link>
        </Button>
        <div className="text-lg font-semibold">TradeIdea</div>
        {tradeIdea?.status ? <Badge variant="outline">{tradeIdea.status}</Badge> : null}
        {tradeIdea?.direction ? (
          <Badge>{tradeIdea.direction === "long" ? "Long" : "Short"}</Badge>
        ) : null}
        {instrumentId ? (
          <Badge variant="secondary">
            <Link
              href={`/admin/symbol/${encodeURIComponent(instrumentId)}`}
              className="hover:underline"
            >
              {symbol}
            </Link>
          </Badge>
        ) : (
          <Badge variant="secondary">{symbol}</Badge>
        )}
      </div>

      {tradeIdea === undefined ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : !tradeIdea ? (
        <div className="text-muted-foreground text-sm">TradeIdea not found.</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Symbol</div>
                <div>{symbol}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Instrument ID</div>
                <div className="break-all">{instrumentId || "—"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Opened</div>
                <div>
                  {typeof tradeIdea.openedAt === "number"
                    ? formatAge(tradeIdea.openedAt)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Closed</div>
                <div>
                  {typeof tradeIdea.closedAt === "number"
                    ? formatAge(tradeIdea.closedAt)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Net qty</div>
                <div>{typeof tradeIdea.netQty === "number" ? tradeIdea.netQty : "—"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Realized P&L</div>
                <div>
                  {typeof tradeIdea.realizedPnl === "number"
                    ? tradeIdea.realizedPnl.toFixed(2)
                    : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Fees</div>
                <div>
                  {typeof tradeIdea.fees === "number" ? tradeIdea.fees.toFixed(2) : "—"}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Avg entry</div>
                <div>
                  {typeof tradeIdea.avgEntryPrice === "number"
                    ? tradeIdea.avgEntryPrice.toFixed(3)
                    : "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Executions (timeline)</CardTitle>
            </CardHeader>
            <CardContent>
              {events === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : events.length === 0 ? (
                <div className="text-muted-foreground text-sm">No events yet.</div>
              ) : (
                <EntityList<TradeIdeaEvent>
                  data={events as any}
                  columns={eventColumns as any}
                  viewModes={["list"]}
                  enableSearch={false}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

