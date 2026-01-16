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

  const note = useQuery(tlQueries.getMyTradeIdeaNoteForGroup, {
    tradeIdeaGroupId: props.tradeIdeaGroupId,
  }) as TradeIdeaNote | undefined;

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

