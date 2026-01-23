"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { cn } from "@acme/ui";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { ActiveAccountSelector } from "~/components/accounts/ActiveAccountSelector";
import { useActiveAccount } from "~/components/accounts/ActiveAccountProvider";

const MOCK_IDEAS = [
  {
    id: "mock-1",
    symbol: "EURUSD",
    type: "Long",
    status: "Closed",
    result: "win",
    pnl: 450,
    date: "Jan 15",
    tags: ["Trend", "A+ Setup"],
    reviewed: true,
  },
  {
    id: "mock-2",
    symbol: "NAS100",
    type: "Short",
    status: "Closed",
    result: "loss",
    pnl: -180,
    date: "Jan 15",
    tags: ["Scalp", "FOMC"],
    reviewed: false,
  },
  {
    id: "mock-3",
    symbol: "BTCUSD",
    type: "Long",
    status: "Open",
    result: "open",
    pnl: 120,
    date: "Jan 16",
    tags: ["Breakout"],
    reviewed: false,
  },
  {
    id: "mock-4",
    symbol: "XAUUSD",
    type: "Short",
    status: "Closed",
    result: "loss",
    pnl: -50,
    date: "Jan 14",
    tags: ["Reversal"],
    reviewed: false,
  },
  {
    id: "mock-5",
    symbol: "US30",
    type: "Long",
    status: "Closed",
    result: "win",
    pnl: 890,
    date: "Jan 12",
    tags: ["Trend"],
    reviewed: true,
  },
];

interface TradeIdeaCardRow extends Record<string, unknown> {
  id: string;
  symbol: string;
  type: "Long" | "Short";
  status: "Open" | "Closed";
  result: "win" | "loss" | "open";
  pnl: number;
  date: string;
  tags: string[];
  reviewed: boolean;
}

interface LiveRecentClosedTradeIdeaRow {
  tradeIdeaGroupId: string;
  symbol: string;
  direction: "long" | "short";
  closedAt: number;
  realizedPnl?: number;
  reviewStatus: "todo" | "reviewed";
}

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export default function AdminTradeIdeasPage() {
  const router = useRouter();
  const dataMode = useDataMode();
  const activeAccount = useActiveAccount();
  const isLive = dataMode.effectiveMode === "live";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const liveRecentClosed = useQuery(
    api.traderlaunchpad.queries.listMyRecentClosedTradeIdeas,
    shouldQuery && isLive
      ? { limit: 200, accountId: activeAccount.selected?.accountId }
      : "skip",
  ) as LiveRecentClosedTradeIdeaRow[] | undefined;

  const ideas: TradeIdeaCardRow[] = React.useMemo(() => {
    if (!isLive) return MOCK_IDEAS as TradeIdeaCardRow[];

    const rows = Array.isArray(liveRecentClosed) ? liveRecentClosed : [];
    return rows.map((r): TradeIdeaCardRow => {
      const pnl = typeof r.realizedPnl === "number" ? r.realizedPnl : 0;
      return {
        id: r.tradeIdeaGroupId,
        symbol: r.symbol,
        type: r.direction === "short" ? "Short" : "Long",
        status: "Closed",
        result: pnl > 0 ? "win" : pnl < 0 ? "loss" : "open",
        pnl,
        date: toDateLabel(r.closedAt),
        tags: [],
        reviewed: r.reviewStatus === "reviewed",
      };
    });
  }, [isLive, liveRecentClosed]);

  const columns = React.useMemo<ColumnDefinition<TradeIdeaCardRow>[]>(
    () => [
      {
        id: "symbol",
        header: "Symbol",
        accessorKey: "symbol",
        cell: (idea: TradeIdeaCardRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">{idea.symbol}</div>
            <div className="text-xs text-white/50">{idea.date}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        cell: (idea: TradeIdeaCardRow) => (
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-1.5 text-[10px]",
              idea.type === "Long"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-red-500/20 bg-red-500/10 text-red-500",
            )}
          >
            {idea.type}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (idea: TradeIdeaCardRow) => (
          <span className="text-sm text-white/80">{idea.status}</span>
        ),
        sortable: true,
      },
      {
        id: "pnl",
        header: "Net P&L",
        accessorKey: "pnl",
        cell: (idea: TradeIdeaCardRow) => (
          <span
            className={cn(
              "text-sm font-semibold",
              idea.pnl > 0
                ? "text-emerald-500"
                : idea.pnl < 0
                  ? "text-red-500"
                  : "text-white/60",
            )}
          >
            {idea.pnl > 0 ? "+" : ""}
            {idea.pnl}
          </span>
        ),
        sortable: true,
      },
      {
        id: "reviewed",
        header: "Review",
        accessorKey: "reviewed",
        cell: (idea: TradeIdeaCardRow) =>
          idea.reviewed ? (
            <span className="text-sm text-emerald-200">Reviewed</span>
          ) : (
            <span className="text-sm text-orange-200">Needs review</span>
          ),
        sortable: true,
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<TradeIdeaCardRow>[]>(
    () => [
      {
        id: "open",
        label: "Open",
        variant: "outline",
        onClick: (idea: TradeIdeaCardRow) => {
          router.push(`/admin/tradeidea/${encodeURIComponent(idea.id)}`);
        },
      },
    ],
    [router],
  );

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Ideas</h1>
          <p className="mt-1 text-white/60">
            Manage your setups and review your execution.
          </p>
        </div>
      </div>

      <EntityList<TradeIdeaCardRow>
        data={ideas}
        columns={columns}
        defaultViewMode="grid"
        viewModes={["grid", "list"]}
        gridColumns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        enableSearch={true}
        title="Ideas"
        description={isLive ? "Live data (closed ideas)" : "Mock data"}
        actions={
          <div className="flex items-center gap-2">
            <ActiveAccountSelector />
            <Button className="bg-white text-black hover:bg-white/90">
              <Plus className="mr-2 h-4 w-4" />
              New Idea
            </Button>
          </div>
        }
        onRowClick={(idea) => {
          router.push(`/admin/tradeidea/${encodeURIComponent(idea.id)}`);
        }}
        entityActions={entityActions}
        getRowId={(idea) => idea.id}
        emptyState={
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/3 p-8 text-white/60">
            <div className="text-lg font-medium text-white">No trade ideas</div>
            <div className="mt-1 text-sm text-white/60">
              Create your first idea to start tracking setups.
            </div>
          </div>
        }
        itemRender={(idea) => (
          <Card
            className="group relative overflow-hidden transition-colors hover:border-white/20 hover:bg-white/5"
          >
            {/* Status Stripe */}
            <div
              className={cn(
                "absolute top-0 left-0 h-full w-1",
                idea.result === "win"
                  ? "bg-emerald-500"
                  : idea.result === "loss"
                    ? "bg-red-500"
                    : "bg-blue-500",
              )}
            />

            <CardHeader className="pb-2 pl-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{idea.symbol}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 px-1.5 text-[10px]",
                        idea.type === "Long"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                          : "border-red-500/20 bg-red-500/10 text-red-500",
                      )}
                    >
                      {idea.type}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {idea.date}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3 pl-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Net P&L
                  </span>
                  <span
                    className={cn(
                      "text-xl font-bold",
                      idea.pnl > 0
                        ? "text-emerald-500"
                        : idea.pnl < 0
                          ? "text-red-500"
                          : "text-muted-foreground",
                    )}
                  >
                    {idea.pnl > 0 ? "+" : ""}${idea.pnl}
                  </span>
                </div>
                {idea.status === "Open" && (
                  <Badge className="animate-pulse bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 border border-orange-500/25">
                    Live
                  </Badge>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-white/10 bg-black/20 pt-3 pb-3 pl-6">
              {idea.reviewed ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Reviewed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-orange-200">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Needs Review
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs hover:bg-white/10"
                asChild
              >
                <Link href={`/admin/tradeidea/${idea.id}`}>
                  Open <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      />
    </div>
  );
}
