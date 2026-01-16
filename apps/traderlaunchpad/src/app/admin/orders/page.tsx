"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

// Mock Data
const ORDERS = [
  {
    id: "mock-ord-001",
    symbol: "EURUSD",
    type: "Buy",
    qty: 1.0,
    price: 1.085,
    status: "Filled",
    time: "10:30 AM",
    date: "Jan 16",
    pnl: null,
  },
  {
    id: "mock-ord-002",
    symbol: "NAS100",
    type: "Sell",
    qty: 0.5,
    price: 16850.0,
    status: "Filled",
    time: "09:45 AM",
    date: "Jan 16",
    pnl: 450.0,
  },
  {
    id: "mock-ord-003",
    symbol: "US30",
    type: "Buy",
    qty: 2.0,
    price: 37500.0,
    status: "Cancelled",
    time: "09:30 AM",
    date: "Jan 16",
    pnl: null,
  },
  {
    id: "mock-ord-004",
    symbol: "XAUUSD",
    type: "Sell",
    qty: 0.1,
    price: 2045.5,
    status: "Filled",
    time: "02:15 PM",
    date: "Jan 15",
    pnl: -50.0,
  },
  {
    id: "mock-ord-005",
    symbol: "GBPUSD",
    type: "Buy",
    qty: 1.5,
    price: 1.268,
    status: "Filled",
    time: "01:00 PM",
    date: "Jan 15",
    pnl: 120.0,
  },
  {
    id: "mock-ord-006",
    symbol: "BTCUSD",
    type: "Buy",
    qty: 0.05,
    price: 42500.0,
    status: "Filled",
    time: "11:20 AM",
    date: "Jan 14",
    pnl: 890.0,
  },
];

export default function AdminOrdersPage() {
  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            History of all your executed and pending orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b p-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="relative w-full sm:w-80">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input placeholder="Search orders..." className="pl-9" />
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 sm:w-auto"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 sm:w-auto"
              >
                Status{" "}
                <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Realized P&L</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.map((order) => (
                <TableRow
                  key={order.id}
                  className="group hover:bg-muted/50 cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{order.date}</span>
                      <span className="text-muted-foreground text-xs">
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
                        "border-0 font-medium",
                        order.type === "Buy"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500",
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
                              ? "bg-muted-foreground"
                              : "bg-blue-500",
                        )}
                      />
                      {order.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {order.pnl !== null ? (
                      <span
                        className={cn(
                          order.pnl > 0 ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {order.pnl > 0 ? "+" : ""}${order.pnl.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
