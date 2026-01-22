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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import Link from "next/link";
import React from "react";
import { cn } from "@acme/ui";
import { useRouter } from "next/navigation";
import { demoAdminOrders } from "@acme/demo-data";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

interface OrderRow {
  id: string;
  date: string;
  time: string;
  symbol: string;
  type: "Buy" | "Sell";
  qty: number;
  price: number;
  status: string;
  pnl: number | null;
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
  const shouldQuery = isAuthenticated && !authLoading;

  const liveOrdersRaw = useQuery(
    api.traderlaunchpad.queries.listMyTradeLockerOrders,
    shouldQuery && dataMode.effectiveMode === "live" ? { limit: 200 } : "skip",
  ) as unknown[] | undefined;

  const orders: OrderRow[] = React.useMemo(() => {
    if (dataMode.effectiveMode === "demo") {
      return demoAdminOrders as unknown as OrderRow[];
    }

    const rows = Array.isArray(liveOrdersRaw) ? liveOrdersRaw : [];
    return rows.map((row): OrderRow => {
      const r: UnknownRecord = isRecord(row) ? row : {};
      const raw: UnknownRecord = isRecord(r.raw) ? r.raw : {};

      const symbol =
        (typeof r.symbol === "string" && r.symbol.trim()) ||
        (typeof raw.symbol === "string" && raw.symbol.trim()) ||
        "—";

      const side =
        (typeof r.side === "string" && r.side) ||
        (typeof raw.side === "string" && raw.side) ||
        "";
      const type: "Buy" | "Sell" =
        side === "sell" || side === "Sell" ? "Sell" : "Buy";

      const createdAtMs =
        toNumber(r.createdAt) ??
        toNumber(raw.createdAt) ??
        (typeof r._creationTime === "number" ? r._creationTime : null);
      const { date, time } = formatDateTime(createdAtMs);

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
        type,
        qty,
        price,
        status,
        pnl,
      };
    });
  }, [dataMode.effectiveMode, liveOrdersRaw]);

  return (
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-white/60">
            History of all your executed and pending orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <div className="flex w-full gap-2 sm:w-auto">
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
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 bg-black/30 hover:bg-black/30">
                <TableHead className="w-[140px] text-white/60">Date</TableHead>
                <TableHead className="text-white/60">Symbol</TableHead>
                <TableHead className="text-white/60">Side</TableHead>
                <TableHead className="text-white/60">Qty</TableHead>
                <TableHead className="text-white/60">Price</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-right text-white/60">Realized P&L</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="group cursor-pointer border-white/5 hover:bg-white/5"
                  onClick={() => router.push(`/admin/order/${order.id}`)}
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
                          order.pnl > 0 ? "text-emerald-200" : "text-rose-200",
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
                          <Link href={`/admin/order/${order.id}`}>
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
        </CardContent>
      </Card>
    </div>
  );
}
