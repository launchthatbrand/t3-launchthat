"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";
import {
  FeatureAccessAlert,
  isFeatureEnabled,
  useGlobalPermissions,
} from "~/components/access/FeatureAccessGate";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import Link from "next/link";
import React from "react";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

interface TradeIdeaCardRow extends Record<string, unknown> {
  id: string;
  symbol: string;
  bias: "long" | "short" | "neutral";
  status: "active" | "closed";
  positionsCount: number;
  pnl: number;
  dateLabel: string;
}

const MOCK_IDEAS: TradeIdeaCardRow[] = [
  { id: "mock-1", symbol: "EURUSD", bias: "long", status: "closed", positionsCount: 2, pnl: 450, dateLabel: "Jan 15" },
  { id: "mock-2", symbol: "NAS100", bias: "short", status: "closed", positionsCount: 3, pnl: -180, dateLabel: "Jan 15" },
  { id: "mock-3", symbol: "BTCUSD", bias: "long", status: "active", positionsCount: 1, pnl: 120, dateLabel: "Jan 16" },
];

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export default function AdminTradeIdeasPage() {
  const router = useRouter();
  const dataMode = useDataMode();
  const isLive = dataMode.effectiveMode === "live";
  const { permissions, isLoading, isAuthenticated, isAdmin } = useGlobalPermissions();
  const canAccess =
    Boolean(isAdmin) || Boolean(permissions && isFeatureEnabled(permissions, "strategies"));
  const shouldQuery = isAuthenticated && !isLoading && canAccess;

  const liveIdeas = useQuery(
    api.traderlaunchpad.queries.listMyTradeIdeas,
    shouldQuery && isLive ? { limit: 200 } : "skip",
  ) as
    | {
      tradeIdeaId: string;
      symbol: string;
      bias: "long" | "short" | "neutral";
      status: "active" | "closed";
      lastActivityAt: number;
      realizedPnl: number;
      positionsCount: number;
    }[]
    | undefined;

  const ideas: TradeIdeaCardRow[] = React.useMemo(() => {
    if (!isLive) return MOCK_IDEAS;
    const rows = Array.isArray(liveIdeas) ? liveIdeas : [];
    return rows.map((r) => ({
      id: r.tradeIdeaId,
      symbol: r.symbol,
      bias: r.bias,
      status: r.status,
      positionsCount: r.positionsCount,
      pnl: r.realizedPnl,
      dateLabel: toDateLabel(r.lastActivityAt),
    }));
  }, [isLive, liveIdeas]);

  const columns = React.useMemo<ColumnDefinition<TradeIdeaCardRow>[]>(
    () => [
      {
        id: "symbol",
        header: "Symbol",
        accessorKey: "symbol",
        cell: (idea: TradeIdeaCardRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">{idea.symbol}</div>
            <div className="text-xs text-muted-foreground">{idea.dateLabel}</div>
          </div>
        ),
        sortable: true,
      },
      {
        id: "bias",
        header: "Bias",
        accessorKey: "bias",
        cell: (idea: TradeIdeaCardRow) => (
          <Badge
            variant="outline"
            className={cn(
              "h-5 px-1.5 text-[10px]",
              idea.bias === "long"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : idea.bias === "short"
                  ? "border-red-500/20 bg-red-500/10 text-red-500"
                  : "border-border/60 bg-background/40 text-muted-foreground",
            )}
          >
            {idea.bias === "long" ? "Long" : idea.bias === "short" ? "Short" : "Neutral"}
          </Badge>
        ),
        sortable: true,
      },
      {
        id: "positionsCount",
        header: "Positions",
        accessorKey: "positionsCount",
        cell: (idea: TradeIdeaCardRow) => (
          <span className="text-sm text-foreground/80">{idea.positionsCount}</span>
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
                  : "text-muted-foreground",
            )}
          >
            {idea.pnl > 0 ? "+" : ""}
            {idea.pnl.toFixed(2)}
          </span>
        ),
        sortable: true,
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (idea: TradeIdeaCardRow) => (
          <span className="text-sm text-foreground/80">
            {idea.status === "active" ? "Active" : "Closed"}
          </span>
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
        onClick: (idea) => {
          router.push(`/admin/tradeideas/${encodeURIComponent(idea.id)}`);
        },
      },
    ],
    [router],
  );

  if (!canAccess && !isLoading) {
    return (
      <FeatureAccessAlert description="You do not have access to Trade Ideas." />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={`tradeideas-skeleton-${index}`} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 text-foreground selection:bg-orange-500/30 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Ideas</h1>
          <p className="mt-1 text-muted-foreground">
            Thesis ideas (shareable) that group multiple positions/trades.
          </p>
        </div>
      </div>

      <EntityList<TradeIdeaCardRow>
        data={ideas}
        columns={columns}
        defaultViewMode="grid"
        viewModes={[]}
        gridColumns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
        enableSearch={true}
        title="Ideas"
        description={isLive ? "Live data (thesis ideas)" : "Mock data"}
        actions={<div />}
        onRowClick={(idea: TradeIdeaCardRow) => {
          router.push(`/admin/tradeideas/${encodeURIComponent(idea.id)}`);
        }}
        entityActions={entityActions}
        getRowId={(idea: TradeIdeaCardRow) => idea.id}
        emptyState={
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/50 p-8 text-muted-foreground">
            <div className="text-lg font-medium text-foreground">No trade ideas</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Sync trades or create an idea to get started.
            </div>
          </div>
        }
        itemRender={(idea: TradeIdeaCardRow) => (
          <Card className="group relative overflow-hidden transition-colors hover:border-border/60 hover:bg-card/60">
            <div
              className={cn(
                "absolute top-0 left-0 h-full w-1",
                idea.pnl > 0 ? "bg-emerald-500" : idea.pnl < 0 ? "bg-red-500" : "bg-blue-500",
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
                        idea.bias === "long"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                          : idea.bias === "short"
                            ? "border-red-500/20 bg-red-500/10 text-red-500"
                            : "border-border/60 bg-background/40 text-muted-foreground",
                      )}
                    >
                      {idea.bias === "long" ? "Long" : idea.bias === "short" ? "Short" : "Neutral"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{idea.dateLabel}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-3 pl-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                    {idea.pnl > 0 ? "+" : ""}
                    {idea.pnl.toFixed(2)}
                  </span>
                </div>
                {idea.status === "active" ? (
                  <Badge className="animate-pulse border border-orange-500/25 bg-orange-500/20 text-orange-200 hover:bg-orange-500/30">
                    Active
                  </Badge>
                ) : null}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {idea.positionsCount} position{idea.positionsCount === 1 ? "" : "s"}
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/40 bg-background/40 pt-3 pb-3 pl-6">
              <div className="text-xs font-medium text-muted-foreground">
                {idea.status === "active" ? "Active thesis" : "Closed thesis"}
              </div>

              <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs hover:bg-foreground/5" asChild>
                <Link href={`/admin/tradeideas/${idea.id}`}>
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
