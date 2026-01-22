"use client";

import { Card, CardContent, CardHeader } from "@acme/ui/card";
import {
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { useConvexAuth, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import Link from "next/link";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { demoAdminOrders } from "@acme/demo-data";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { ActiveAccountSelector } from "~/components/accounts/ActiveAccountSelector";
import { useRouter } from "next/navigation";

interface OrderRow {
  id: string;
  date: string;
  time: string;
  symbol: string;
  instrumentId?: string;
  type: "Buy" | "Sell";
  qty: number;
  price: number;
  status: string;
  pnl: number | null;
  kind: "order" | "history";
}

interface PositionRow {
  id: string;
  date: string;
  time: string;
  symbol: string;
  instrumentId?: string;
  side: "Buy" | "Sell";
  qty: number;
  avgPrice: number;
}

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const formatDateTime = (tsMs: number | null): { date: string; time: string } => {
  if (!tsMs || !Number.isFinite(tsMs)) return { date: "—", time: "" };
  const d = new Date(tsMs);
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const dataMode = useDataMode();
  const [tab, setTab] = React.useState<"filled" | "pending" | "positions">(
    "filled",
  );
  const shouldQuery = isAuthenticated && !authLoading;

  const livePendingRaw = useQuery(
    api.traderlaunchpad.queries.listMyTradeLockerOrders,
    shouldQuery && dataMode.effectiveMode === "live" ? { limit: 200 } : "skip",
  ) as unknown[] | undefined;

  const liveFilledRaw = useQuery(
    api.traderlaunchpad.queries.listMyTradeLockerOrdersHistory,
    shouldQuery && dataMode.effectiveMode === "live" ? { limit: 500 } : "skip",
  ) as unknown[] | undefined;

  const livePositionsRaw = useQuery(
    api.traderlaunchpad.queries.listMyTradeLockerPositions,
    shouldQuery && dataMode.effectiveMode === "live" ? { limit: 200 } : "skip",
  ) as unknown[] | undefined;

  const tradableInstrumentIdsForLookup = React.useMemo(() => {
    if (dataMode.effectiveMode !== "live") return [];
    const rows = [
      ...(Array.isArray(livePendingRaw) ? livePendingRaw : []),
      ...(Array.isArray(liveFilledRaw) ? liveFilledRaw : []),
      ...(Array.isArray(livePositionsRaw) ? livePositionsRaw : []),
    ];
    const ids: string[] = [];
    for (const row of rows) {
      const r: UnknownRecord = isRecord(row) ? row : {};
      const raw: UnknownRecord = isRecord(r.raw) ? r.raw : {};
      const id =
        (typeof r.instrumentId === "string" && r.instrumentId.trim()) ||
        (typeof raw.instrumentId === "string" && raw.instrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "string" &&
          raw.tradableInstrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "number" &&
          Number.isFinite(raw.tradableInstrumentId)
          ? String(raw.tradableInstrumentId)
          : "");
      if (id) ids.push(id);
    }
    return Array.from(new Set(ids)).sort();
  }, [dataMode.effectiveMode, liveFilledRaw, livePendingRaw, livePositionsRaw]);

  const pricedataSymbolsRaw = useQuery(
    api.traderlaunchpad.queries.getMyPriceDataSymbolsByTradableInstrumentIds,
    shouldQuery &&
      dataMode.effectiveMode === "live" &&
      tradableInstrumentIdsForLookup.length > 0
      ? { tradableInstrumentIds: tradableInstrumentIdsForLookup }
      : "skip",
  ) as { tradableInstrumentId: string; symbol: string }[] | undefined;

  const symbolByTradableInstrumentId = React.useMemo(() => {
    const map = new Map<string, string>();
    const rows = Array.isArray(pricedataSymbolsRaw) ? pricedataSymbolsRaw : [];
    for (const r of rows) {
      if (!r) continue;
      if (typeof r.tradableInstrumentId !== "string") continue;
      if (typeof r.symbol !== "string") continue;
      const id = r.tradableInstrumentId.trim();
      const sym = r.symbol.trim();
      if (!id || !sym) continue;
      map.set(id, sym);
    }
    return map;
  }, [pricedataSymbolsRaw]);

  const toOrderRow = React.useCallback(
    (row: unknown, kind: "order" | "history"): OrderRow => {
      const r: UnknownRecord = isRecord(row) ? row : {};
      const raw: UnknownRecord = isRecord(r.raw) ? r.raw : {};

      const instrumentId =
        (typeof r.instrumentId === "string" && r.instrumentId.trim()) ||
        (typeof raw.instrumentId === "string" && raw.instrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "string" &&
          raw.tradableInstrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "number" &&
          Number.isFinite(raw.tradableInstrumentId)
          ? String(raw.tradableInstrumentId)
          : undefined);

      const symbolRaw =
        (typeof r.symbol === "string" && r.symbol.trim()) ||
        (typeof raw.symbol === "string" && raw.symbol.trim()) ||
        "";
      const symbol =
        symbolRaw ||
        (instrumentId ? symbolByTradableInstrumentId.get(instrumentId) : "") ||
        (instrumentId ? `#${instrumentId}` : "") ||
        "—";

      const side =
        (typeof r.side === "string" && r.side) ||
        (typeof raw.side === "string" && raw.side) ||
        "";
      const type: "Buy" | "Sell" =
        side === "sell" || side === "Sell" ? "Sell" : "Buy";

      const tsMs =
        toNumber(r.createdAt) ??
        toNumber(r.closedAt) ??
        toNumber(raw.createdAt) ??
        toNumber(raw.closedAt) ??
        (typeof r._creationTime === "number" ? r._creationTime : null);
      const { date, time } = formatDateTime(tsMs);

      const qty =
        toNumber(raw.qty) ??
        toNumber(raw.quantity) ??
        toNumber(raw.volume) ??
        0;

      const price =
        toNumber(raw.price) ??
        toNumber(raw.avgPrice) ??
        toNumber(raw.averagePrice) ??
        0;

      const status =
        (typeof r.status === "string" && r.status) ||
        (typeof raw.status === "string" && raw.status) ||
        "—";

      const externalId =
        (typeof r.externalOrderId === "string" && r.externalOrderId) ||
        (typeof raw.externalOrderId === "string" && raw.externalOrderId) ||
        (typeof r._id === "string" && r._id) ||
        "—";

      const pnl =
        toNumber(raw.pnl) ??
        toNumber(raw.realizedPnl) ??
        null;

      return {
        id: externalId,
        date,
        time,
        symbol,
        instrumentId,
        type,
        qty,
        price,
        status,
        pnl,
        kind,
      };
    },
    [symbolByTradableInstrumentId],
  );

  const pendingOrders: OrderRow[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") return [];
    const rows = Array.isArray(livePendingRaw) ? livePendingRaw : [];
    return rows.map((r) => toOrderRow(r, "order"));
  }, [dataMode.effectiveMode, livePendingRaw, toOrderRow]);

  const filledOrders: OrderRow[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") {
      // Demo dataset currently represents executed trades, so treat it as history.
      return (demoAdminOrders as unknown as Omit<OrderRow, "kind">[]).map(
        (r) => ({ ...r, kind: "history" as const }),
      );
    }
    const rows = Array.isArray(liveFilledRaw) ? liveFilledRaw : [];
    return rows.map((r) => toOrderRow(r, "history"));
  }, [dataMode.effectiveMode, liveFilledRaw, toOrderRow]);

  const positions: PositionRow[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") return [];
    const rows = Array.isArray(livePositionsRaw) ? livePositionsRaw : [];
    return rows.map((row): PositionRow => {
      const r: UnknownRecord = isRecord(row) ? row : {};
      const raw: UnknownRecord = isRecord(r.raw) ? r.raw : {};

      const instrumentId =
        (typeof r.instrumentId === "string" && r.instrumentId.trim()) ||
        (typeof raw.instrumentId === "string" && raw.instrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "string" &&
          raw.tradableInstrumentId.trim()) ||
        (typeof raw.tradableInstrumentId === "number" &&
          Number.isFinite(raw.tradableInstrumentId)
          ? String(raw.tradableInstrumentId)
          : undefined);

      const symbolRaw =
        (typeof r.symbol === "string" && r.symbol.trim()) ||
        (typeof raw.symbol === "string" && raw.symbol.trim()) ||
        "";
      const symbol =
        symbolRaw ||
        (instrumentId ? symbolByTradableInstrumentId.get(instrumentId) : "") ||
        (instrumentId ? `#${instrumentId}` : "") ||
        "—";
      const sideRaw =
        (typeof r.side === "string" && r.side) ||
        (typeof raw.side === "string" && raw.side) ||
        "";
      const side: "Buy" | "Sell" =
        sideRaw === "sell" || sideRaw === "Sell" ? "Sell" : "Buy";

      const openedAtMs =
        toNumber(r.openedAt) ??
        toNumber(raw.openedAt) ??
        toNumber(raw.createdAt) ??
        (typeof r._creationTime === "number" ? r._creationTime : null);
      const { date, time } = formatDateTime(openedAtMs);

      const qty = toNumber(r.qty) ?? toNumber(raw.qty) ?? 0;
      const avgPrice = toNumber(r.avgPrice) ?? toNumber(raw.avgPrice) ?? 0;

      const id =
        (typeof r.externalPositionId === "string" && r.externalPositionId) ||
        (typeof raw.externalPositionId === "string" && raw.externalPositionId) ||
        (typeof r._id === "string" && r._id) ||
        "—";

      return { id, date, time, symbol, instrumentId, side, qty, avgPrice };
    });
  }, [dataMode.effectiveMode, livePositionsRaw, symbolByTradableInstrumentId]);

  const activeRows: OrderRow[] =
    tab === "pending" ? pendingOrders : tab === "filled" ? filledOrders : [];

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-white/60">
            Pending orders, filled orders, and open positions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActiveAccountSelector />
          <Button
            variant="outline"
            className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b border-white/10 p-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search orders..."
                className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/30 focus-visible:ring-orange-500/40"
              />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="border border-white/10 bg-black/20">
                  <TabsTrigger
                    value="filled"
                    className="data-[state=active]:bg-white/10"
                  >
                    Filled ({filledOrders.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-white/10"
                  >
                    Pending ({pendingOrders.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="positions"
                    className="data-[state=active]:bg-white/10"
                  >
                    Positions ({positions.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                Status{" "}
                <ChevronDown className="h-3.5 w-3.5 text-white/40" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tab === "positions" ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-black/30 hover:bg-black/30">
                  <TableHead className="w-[140px] text-white/60">
                    Opened
                  </TableHead>
                  <TableHead className="text-white/60">Symbol</TableHead>
                  <TableHead className="text-white/60">Side</TableHead>
                  <TableHead className="text-white/60">Qty</TableHead>
                  <TableHead className="text-white/60">Avg price</TableHead>
                  <TableHead className="text-white/60">Position ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => (
                  <TableRow
                    key={p.id}
                    className="border-white/5 hover:bg-white/5"
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{p.date}</span>
                        <span className="text-xs text-white/40">{p.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{p.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border border-white/10 bg-black/20 font-medium",
                          p.side === "Buy"
                            ? "bg-emerald-500/10 text-emerald-200"
                            : "bg-red-500/10 text-red-200",
                        )}
                      >
                        {p.side}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.qty}</TableCell>
                    <TableCell>
                      {p.avgPrice.toFixed(
                        p.symbol.includes("JPY") || p.symbol.includes("NAS")
                          ? 2
                          : 4,
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/60">
                      {p.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-black/30 hover:bg-black/30">
                  <TableHead className="w-[140px] text-white/60">Date</TableHead>
                  <TableHead className="text-white/60">Symbol</TableHead>
                  <TableHead className="text-white/60">Side</TableHead>
                  <TableHead className="text-white/60">Qty</TableHead>
                  <TableHead className="text-white/60">Price</TableHead>
                  <TableHead className="text-white/60">Status</TableHead>
                  <TableHead className="text-right text-white/60">
                    Realized P&L
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRows.map((order) => (
                  <TableRow
                    key={`${order.kind}:${order.id}`}
                    className="group cursor-pointer border-white/5 hover:bg-white/5"
                    onClick={() =>
                      router.push(
                        `/admin/order/${order.id}?kind=${order.kind}`,
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{order.date}</span>
                        <span className="text-xs text-white/40">
                          {order.time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{order.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border border-white/10 bg-black/20 font-medium",
                          order.type === "Buy"
                            ? "bg-emerald-500/10 text-emerald-200"
                            : "bg-red-500/10 text-red-200",
                        )}
                      >
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.qty}</TableCell>
                    <TableCell>
                      {order.price.toFixed(
                        order.symbol.includes("JPY") ||
                          order.symbol.includes("NAS")
                          ? 2
                          : 4,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            order.status === "Filled"
                              ? "bg-emerald-500"
                              : order.status === "Cancelled"
                                ? "bg-white/30"
                                : "bg-blue-500",
                          )}
                        />
                        <span className="text-white/80">{order.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {order.pnl !== null ? (
                        <span
                          className={cn(
                            order.pnl > 0
                              ? "text-emerald-200"
                              : "text-rose-200",
                          )}
                        >
                          {order.pnl > 0 ? "+" : ""}${order.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-black/70 text-white"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/order/${order.id}?kind=${order.kind}`}
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
