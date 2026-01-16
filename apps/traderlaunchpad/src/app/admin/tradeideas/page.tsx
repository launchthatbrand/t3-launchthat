"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

import { cn } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

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

export default function AdminTradeIdeasPage() {
  const [view, setView] = React.useState<"grid" | "list">("grid");

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Ideas</h1>
          <p className="text-muted-foreground mt-1">
            Manage your setups and review your execution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card flex flex-col items-center justify-between gap-4 rounded-lg border p-4 sm:flex-row">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Search symbol, tag..."
              className="bg-background pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "grid" | "list")}
          >
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Grid View Content */}
      <div
        className={cn(
          "grid gap-6",
          view === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1",
        )}
      >
        {MOCK_IDEAS.map((idea) => (
          <Card
            key={idea.id}
            className="group relative overflow-hidden transition-colors hover:border-blue-500/50"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>View Chart</DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem className="text-red-500">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="pb-3 pl-6">
              <div className="mb-4 flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

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
                  <Badge className="animate-pulse bg-blue-500 hover:bg-blue-600">
                    Live
                  </Badge>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-muted/30 flex items-center justify-between border-t pt-3 pb-3 pl-6">
              {idea.reviewed ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Reviewed
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Needs Review
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                asChild
              >
                <Link href={`/admin/tradeidea/${idea.id}`}>
                  Open <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* Add New Placeholder Card */}
        <button className="text-muted-foreground hover:bg-muted/50 hover:border-primary/50 flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 transition-all">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Add New Idea</span>
        </button>
      </div>
    </div>
  );
}
