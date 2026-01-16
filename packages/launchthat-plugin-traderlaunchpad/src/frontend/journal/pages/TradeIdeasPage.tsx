"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";

import type { TraderLaunchpadApiAdapter } from "../TraderLaunchpadAccountTab";
import { formatAge } from "../TraderLaunchpadAccountTab";

type TradeIdeaRow = Record<string, unknown> & {
  _id: string;
  status: "open" | "closed";
  symbol: string;
  instrumentId?: string;
  direction: "long" | "short";
  openedAt: number;
  closedAt?: number;
  netQty: number;
  realizedPnl?: number;
  fees?: number;
};

const columns: ColumnDefinition<TradeIdeaRow>[] = [
  {
    id: "symbol",
    header: "Symbol",
    accessorKey: "symbol",
    cell: (row: TradeIdeaRow) =>
      row.instrumentId ? (
        <Link
          href={`/admin/symbol/${encodeURIComponent(String(row.instrumentId))}`}
          className="text-blue-600 hover:underline"
        >
          {row.symbol}
        </Link>
      ) : (
        row.symbol
      ),
  },
  { id: "status", header: "Status", accessorKey: "status" },
  {
    id: "direction",
    header: "Dir",
    accessorKey: "direction",
    cell: (row: TradeIdeaRow) => (row.direction === "long" ? "Long" : "Short"),
  },
  {
    id: "openedAt",
    header: "Opened",
    accessorKey: "openedAt",
    cell: (row: TradeIdeaRow) =>
      typeof row.openedAt === "number" ? formatAge(row.openedAt) : "—",
  },
  {
    id: "closedAt",
    header: "Closed",
    accessorKey: "closedAt",
    cell: (row: TradeIdeaRow) =>
      typeof row.closedAt === "number" ? formatAge(row.closedAt) : "—",
  },
  {
    id: "pnl",
    header: "P&L",
    accessorKey: "realizedPnl",
    cell: (row: TradeIdeaRow) =>
      typeof row.realizedPnl === "number" ? row.realizedPnl.toFixed(2) : "—",
  },
  {
    id: "actions",
    header: "",
    cell: (row: TradeIdeaRow) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/tradeidea/${encodeURIComponent(row._id)}`}>View</Link>
      </Button>
    ),
  },
];

export function TraderLaunchpadTradeIdeasPage(props: { api: TraderLaunchpadApiAdapter }) {
  const tlQueries = props.api.queries;

  const [status, setStatus] = React.useState<"open" | "closed">("closed");

  const result = useQuery(tlQueries.listMyTradeIdeasByStatus, {
    status,
    paginationOpts: { numItems: 50, cursor: null },
  }) as
    | {
        page: TradeIdeaRow[];
        isDone: boolean;
        continueCursor: string | null;
      }
    | undefined;

  const rows = result?.page ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">TradeIdeas</div>
          <Badge variant="outline">{status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={status === "open" ? "default" : "outline"}
            onClick={() => setStatus("open")}
          >
            Open
          </Button>
          <Button
            variant={status === "closed" ? "default" : "outline"}
            onClick={() => setStatus("closed")}
          >
            Closed
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
        </CardHeader>
        <CardContent>
          {result === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground text-sm">No TradeIdeas.</div>
          ) : (
            <EntityList<TradeIdeaRow>
              data={rows as any}
              columns={columns as any}
              viewModes={["list"]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

