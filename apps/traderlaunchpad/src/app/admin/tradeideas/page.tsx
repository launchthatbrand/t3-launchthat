"use client";

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
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { cn } from "@acme/ui";

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
    <div className="relative animate-in fade-in space-y-8 text-white selection:bg-orange-500/30 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Ideas</h1>
          <p className="mt-1 text-white/60">
            Manage your setups and review your execution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-white text-black hover:bg-white/90">
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search symbol, tag..."
              className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/30 focus-visible:ring-orange-500/40"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "grid" | "list")}
          >
            <TabsList className="border border-white/10 bg-black/20">
              <TabsTrigger value="grid" className="data-[state=active]:bg-white/10">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-white/10">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-white/10 bg-black/70 text-white">
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
                    className="border border-white/10 bg-white/5 text-xs font-normal text-white/80"
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
        ))}

        {/* Add New Placeholder Card */}
        <button className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/3 p-8 text-white/60 transition-all hover:border-white/25 hover:bg-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Add New Idea</span>
        </button>
      </div>
    </div>
  );
}
