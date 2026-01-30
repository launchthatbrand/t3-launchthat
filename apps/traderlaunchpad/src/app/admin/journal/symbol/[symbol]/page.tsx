"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@convex-config/_generated/api";

import { PublicSymbolPricePanel } from "~/components/price/PublicSymbolPricePanel";
import { useTenant } from "~/context/TenantContext";
import {
  FeatureAccessAlert,
  isFeatureEnabled,
  useGlobalPermissions,
} from "~/components/access/FeatureAccessGate";

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

function formatCurrency(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

interface OrgSymbolRow {
  userId: string;
  email: string | null;
  name: string | null;
  role: string | null;
  group: null | {
    tradeIdeaGroupId: string;
    symbol: string;
    direction: "long" | "short";
    status: "open" | "closed";
    openedAt: number;
    closedAt?: number;
    realizedPnl?: number;
    fees?: number;
  };
}

interface MySymbolTradeRow {
  tradeIdeaGroupId: string;
  symbol: string;
  direction: "long" | "short";
  status: "open" | "closed";
  openedAt: number;
  closedAt?: number;
  realizedPnl?: number;
  fees?: number;
}

export default function AdminJournalSymbolPage() {
  const params = useParams();
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");
  const organizationId = tenant?._id ?? "";

  const { permissions, isLoading, isAuthenticated, isAdmin } = useGlobalPermissions();
  const canAccess =
    Boolean(isAdmin) || Boolean(permissions && isFeatureEnabled(permissions, "openPositions"));
  const shouldQuery = isAuthenticated && !isLoading && canAccess && Boolean(organizationId);

  const rawSymbol =
    typeof (params as Record<string, unknown>).symbol === "string"
      ? String((params as Record<string, unknown>).symbol)
      : "";
  const decoded = rawSymbol ? decodeURIComponent(rawSymbol) : "";
  const canonical = normalizeSymbol(decoded);

  const orgRows = useQuery(
    api.traderlaunchpad.queries.listOrgSymbolLatestTrades,
    shouldQuery && isOrgMode && canonical
      ? { organizationId, symbol: canonical, maxMembers: 200 }
      : "skip",
  ) as OrgSymbolRow[] | undefined;

  const myRows = useQuery(
    api.traderlaunchpad.queries.listMySymbolTrades,
    shouldQuery && !isOrgMode && canonical ? { symbol: canonical, limit: 200 } : "skip",
  ) as MySymbolTradeRow[] | undefined;

  const list = Array.isArray(orgRows) ? orgRows : [];
  const withTrades = list.filter(
    (r): r is OrgSymbolRow & { group: NonNullable<OrgSymbolRow["group"]> } =>
      Boolean(r.group),
  );

  const orgAggregate = React.useMemo(() => {
    if (!isOrgMode) return null;
    let openTrades = 0;
    let closedTrades = 0;
    let totalPnl = 0;
    for (const row of withTrades) {
      if (row.group.status === "open") openTrades += 1;
      else closedTrades += 1;
      if (typeof row.group.realizedPnl === "number") totalPnl += row.group.realizedPnl;
    }
    return {
      memberCount: withTrades.length,
      openTrades,
      closedTrades,
      totalPnl,
    };
  }, [isOrgMode, withTrades]);

  if (!canAccess && !isLoading) {
    return (
      <div className="container py-8">
        <FeatureAccessAlert description="You do not have access to Open Positions." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/admin/journal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to journal
          </Link>
        </Button>

        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <Search className="h-4 w-4 text-white/40" />
          {isOrgMode
            ? `${withTrades.length} member${withTrades.length === 1 ? "" : "s"}`
            : `${Array.isArray(myRows) ? myRows.length : 0} trade${Array.isArray(myRows) && myRows.length === 1 ? "" : "s"
            }`}{" "}
          • {canonical || "—"}
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">{canonical || "Symbol"}</h1>
        <p className="mt-1 text-sm text-white/60">
          {isOrgMode
            ? "Organization journal view for this symbol (aggregated across members)."
            : "Your journal view for this symbol."}
        </p>
      </div>

      {canonical ? <PublicSymbolPricePanel symbol={canonical} /> : null}

      {isOrgMode && orgAggregate ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-md">
            <div className="text-xs text-white/60">Members with trades</div>
            <div className="mt-1 text-lg font-semibold text-white">{orgAggregate.memberCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-md">
            <div className="text-xs text-white/60">Open positions</div>
            <div className="mt-1 text-lg font-semibold text-white">{orgAggregate.openTrades}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-md">
            <div className="text-xs text-white/60">Closed positions</div>
            <div className="mt-1 text-lg font-semibold text-white">{orgAggregate.closedTrades}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-md">
            <div className="text-xs text-white/60">Total realized PnL</div>
            <div className="mt-1 text-lg font-semibold text-white">{formatCurrency(orgAggregate.totalPnl)}</div>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <Card className="overflow-hidden border-white/10 bg-white/3 backdrop-blur-md">
          <CardHeader className="border-b border-white/10 p-4">
            <CardTitle className="text-base">
              {isOrgMode
                ? `Members trading ${canonical || "—"}`
                : `Your trades for ${canonical || "—"}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isOrgMode ? (
              orgRows === undefined ? (
                <div className="space-y-3 p-6">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : withTrades.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10">
                  <Search className="h-5 w-5 text-white/40" />
                  <div className="mt-2 text-lg font-medium text-white">No member trades found</div>
                  <div className="mt-1 text-sm text-white/60">
                    No active members have traded {canonical} yet.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  <div className="grid grid-cols-12 gap-2 bg-black/40 px-5 py-3 text-xs font-semibold text-white/60">
                    <div className="col-span-4">Member</div>
                    <div className="col-span-5">Latest trade</div>
                    <div className="col-span-3 text-right">PnL</div>
                  </div>
                  {withTrades.map((r) => {
                    const g = r.group;
                    const pnl = typeof g.realizedPnl === "number" ? g.realizedPnl : 0;
                    return (
                      <div
                        key={r.userId}
                        className="grid grid-cols-12 gap-2 px-5 py-4 text-sm text-white/80"
                      >
                        <div className="col-span-4 min-w-0">
                          <div className="truncate font-semibold text-white">
                            {r.name ?? r.email ?? "Member"}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/50">
                            {r.role ? <Badge variant="secondary">{r.role}</Badge> : null}
                            <span className="font-mono">{r.userId.slice(0, 10)}…</span>
                          </div>
                        </div>
                        <div className="col-span-5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                              {g.status.toUpperCase()}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                              {g.direction === "long" ? "Long" : "Short"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                              Opened {new Date(g.openedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-3">
                          <div className={pnl >= 0 ? "text-emerald-200" : "text-rose-200"}>
                            {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                          </div>
                          <Link
                            href={`/admin/tradeideas/${encodeURIComponent(g.tradeIdeaGroupId)}`}
                            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
                          >
                            View
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : myRows === undefined ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (Array.isArray(myRows) ? myRows : []).length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10">
                <Search className="h-5 w-5 text-white/40" />
                <div className="mt-2 text-lg font-medium text-white">No trades found</div>
                <div className="mt-1 text-sm text-white/60">You haven’t traded {canonical} yet.</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-12 gap-2 bg-black/40 px-5 py-3 text-xs font-semibold text-white/60">
                  <div className="col-span-5">Trade</div>
                  <div className="col-span-4">Opened</div>
                  <div className="col-span-3 text-right">PnL</div>
                </div>
                {myRows.map((t) => {
                  const pnl = typeof t.realizedPnl === "number" ? t.realizedPnl : 0;
                  return (
                    <div
                      key={t.tradeIdeaGroupId}
                      className="grid grid-cols-12 gap-2 px-5 py-4 text-sm text-white/80"
                    >
                      <div className="col-span-5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                            {t.status.toUpperCase()}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                            {t.direction === "long" ? "Long" : "Short"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono">
                            {t.tradeIdeaGroupId.slice(0, 10)}…
                          </span>
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/admin/tradeideas/${encodeURIComponent(t.tradeIdeaGroupId)}`}
                            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
                          >
                            View
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </Link>
                        </div>
                      </div>
                      <div className="col-span-4 flex items-center text-xs text-white/60">
                        {new Date(t.openedAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-3 flex items-center justify-end">
                        <div className={pnl >= 0 ? "text-emerald-200" : "text-rose-200"}>
                          {pnl >= 0 ? "+" : "-"}${Math.abs(pnl).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

