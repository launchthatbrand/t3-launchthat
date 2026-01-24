"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

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

type TradeIdeaRealizationEvent = {
  externalEventId: string;
  externalPositionId: string;
  externalOrderId?: string;
  openAtMs?: number;
  openPrice?: number;
  closePrice?: number;
  commission?: number;
  swap?: number;
  openOrderId?: string;
  openTradeId?: string;
  closeTradeId?: string;
  closedAt: number;
  realizedPnl: number;
  fees?: number;
  qtyClosed?: number;
};

type TradeIdeaNote = {
  _id: string;
  reviewStatus: "todo" | "reviewed";
  reviewedAt?: number;
  thesis?: string;
  setup?: string;
  mistakes?: string;
  outcome?: string;
  nextTime?: string;
  tags?: string[];
  updatedAt: number;
} | null;

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

const realizationColumns: ColumnDefinition<TradeIdeaRealizationEvent>[] = [
  {
    id: "closedAt",
    header: "Closed",
    accessorKey: "closedAt",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.closedAt === "number" ? formatAge(row.closedAt) : "—",
  },
  {
    id: "qtyClosed",
    header: "Close size",
    accessorKey: "qtyClosed",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.qtyClosed === "number" ? row.qtyClosed : "—",
  },
  {
    id: "realizedPnl",
    header: "Net P&L",
    accessorKey: "realizedPnl",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.realizedPnl === "number" ? row.realizedPnl.toFixed(2) : "—",
  },
  {
    id: "commission",
    header: "Comm",
    accessorKey: "commission",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.commission === "number" ? row.commission.toFixed(2) : "—",
  },
  {
    id: "swap",
    header: "Swap",
    accessorKey: "swap",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.swap === "number" ? row.swap.toFixed(2) : "—",
  },
  {
    id: "fees",
    header: "Fees",
    accessorKey: "fees",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.fees === "number" ? row.fees.toFixed(2) : "—",
  },
  {
    id: "prices",
    header: "Entry → Exit",
    accessorKey: "closePrice",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.openPrice === "number" && typeof row.closePrice === "number"
        ? `${row.openPrice.toFixed(3)} → ${row.closePrice.toFixed(3)}`
        : "—",
  },
  {
    id: "hold",
    header: "Hold",
    accessorKey: "openAtMs",
    cell: (row: TradeIdeaRealizationEvent) =>
      typeof row.openAtMs === "number" && typeof row.closedAt === "number"
        ? (() => {
            const ms = Math.max(0, row.closedAt - row.openAtMs);
            const totalMinutes = Math.floor(ms / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (hours <= 0) return `${minutes}m`;
            if (minutes <= 0) return `${hours}h`;
            return `${hours}h ${minutes}m`;
          })()
        : "—",
  },
  {
    id: "ids",
    header: "IDs",
    accessorKey: "externalEventId",
    cell: (row: TradeIdeaRealizationEvent) => (
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          show
        </summary>
        <div className="mt-1 space-y-1">
          <div className="break-all">event: {row.externalEventId}</div>
          <div className="break-all">position: {row.externalPositionId}</div>
          {row.openOrderId ? <div className="break-all">open order: {row.openOrderId}</div> : null}
          {row.externalOrderId ? (
            <div className="break-all">close order: {row.externalOrderId}</div>
          ) : null}
          {row.openTradeId ? <div className="break-all">open trade: {row.openTradeId}</div> : null}
          {row.closeTradeId ? (
            <div className="break-all">close trade: {row.closeTradeId}</div>
          ) : null}
        </div>
      </details>
    ),
  },
];

export function TraderLaunchpadTradeIdeaDetailPage(props: {
  api: TraderLaunchpadApiAdapter;
  tradeIdeaGroupId: string;
}) {
  const tlQueries = props.api.queries;
  const tlMutations = props.api.mutations;

  const upsertNote = useMutation(tlMutations.upsertMyTradeIdeaNoteForGroup);
  const markReviewed = useMutation(tlMutations.markMyTradeIdeaReviewed);

  const tradeIdea = useQuery(tlQueries.getMyTradeIdeaById, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
  }) as TradeIdea | null | undefined;

  const events = useQuery(tlQueries.listMyTradeIdeaEvents, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
    limit: 200,
  }) as TradeIdeaEvent[] | undefined;

  const realizationEvents = useQuery(tlQueries.listMyTradeIdeaRealizationEvents, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
    limit: 2000,
  }) as TradeIdeaRealizationEvent[] | undefined;

  const note = useQuery(tlQueries.getMyTradeIdeaNoteForGroup, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
  }) as TradeIdeaNote | undefined;

  const realizationTotals = React.useMemo(() => {
    const rows = Array.isArray(realizationEvents) ? realizationEvents : [];
    let realizedPnl = 0;
    let commission = 0;
    let swap = 0;
    let fees = 0;
    let qtyClosed = 0;
    for (const r of rows) {
      if (typeof r.realizedPnl === "number") realizedPnl += r.realizedPnl;
      if (typeof r.commission === "number") commission += r.commission;
      if (typeof r.swap === "number") swap += r.swap;
      if (typeof r.fees === "number") fees += r.fees;
      if (typeof r.qtyClosed === "number") qtyClosed += r.qtyClosed;
    }
    return { count: rows.length, realizedPnl, commission, swap, fees, qtyClosed };
  }, [realizationEvents]);

  const [draft, setDraft] = React.useState<{
    thesis: string;
    setup: string;
    mistakes: string;
    outcome: string;
    nextTime: string;
    tags: string;
  }>({
    thesis: "",
    setup: "",
    mistakes: "",
    outcome: "",
    nextTime: "",
    tags: "",
  });

  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    if (note === undefined) return;
    didInitRef.current = true;
    setDraft({
      thesis: note?.thesis ?? "",
      setup: note?.setup ?? "",
      mistakes: note?.mistakes ?? "",
      outcome: note?.outcome ?? "",
      nextTime: note?.nextTime ?? "",
      tags: Array.isArray(note?.tags) ? note!.tags.join(", ") : "",
    });
  }, [note]);

  const reviewStatus = note?.reviewStatus ?? "todo";

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
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Review</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={reviewStatus === "reviewed" ? "default" : "outline"}>
                  {reviewStatus === "reviewed" ? "Reviewed" : "To review"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewStatus === "reviewed"}
                  onClick={async () => {
                    try {
                      await markReviewed({ tradeIdeaGroupId: props.tradeIdeaGroupId });
                      toast.success("Marked reviewed");
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Failed to mark reviewed",
                      );
                    }
                  }}
                >
                  Mark reviewed
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="thesis">Thesis</Label>
                <Textarea
                  id="thesis"
                  value={draft.thesis}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, thesis: e.target.value }))
                  }
                  placeholder="Why did you take this trade?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="setup">Setup</Label>
                <Textarea
                  id="setup"
                  value={draft.setup}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, setup: e.target.value }))
                  }
                  placeholder="Pattern / playbook / conditions"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mistakes">Mistakes</Label>
                <Textarea
                  id="mistakes"
                  value={draft.mistakes}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, mistakes: e.target.value }))
                  }
                  placeholder="What went wrong (if anything)?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea
                  id="outcome"
                  value={draft.outcome}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, outcome: e.target.value }))
                  }
                  placeholder="What happened?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextTime">Next time</Label>
                <Textarea
                  id="nextTime"
                  value={draft.nextTime}
                  onChange={(e) =>
                    setDraft((s) => ({ ...s, nextTime: e.target.value }))
                  }
                  placeholder="What will you do differently next time?"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={draft.tags}
                  onChange={(e) => setDraft((s) => ({ ...s, tags: e.target.value }))}
                  placeholder="comma,separated,tags"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={async () => {
                    const tags = draft.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    try {
                      await upsertNote({
                        tradeIdeaGroupId: props.tradeIdeaGroupId,
                        thesis: draft.thesis || undefined,
                        setup: draft.setup || undefined,
                        mistakes: draft.mistakes || undefined,
                        outcome: draft.outcome || undefined,
                        nextTime: draft.nextTime || undefined,
                        tags: tags.length ? tags : undefined,
                      });
                      toast.success("Saved");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed to save");
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Realizations</CardTitle>
              <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
                <Badge variant="outline">{realizationTotals.count} events</Badge>
                <Badge variant="outline">Size {realizationTotals.qtyClosed.toFixed(2)}</Badge>
                <Badge variant="outline">P&L {realizationTotals.realizedPnl.toFixed(2)}</Badge>
                <Badge variant="outline">Fees {realizationTotals.fees.toFixed(2)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {realizationEvents === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : realizationEvents.length === 0 ? (
                <div className="text-muted-foreground text-sm">No realizations yet.</div>
              ) : (
                <EntityList<TradeIdeaRealizationEvent>
                  data={realizationEvents as any}
                  columns={realizationColumns as any}
                  viewModes={["list"]}
                  enableSearch={false}
                />
              )}
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

