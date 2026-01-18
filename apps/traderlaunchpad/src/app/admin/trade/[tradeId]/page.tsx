import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { demoAdminOrders, demoReviewTrades } from "@acme/demo-data";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { NotesSection } from "~/components/admin/NotesSection";
import { TradingChartCard } from "~/components/charts/TradingChartCard";
import { cn } from "@acme/ui";
import { notFound } from "next/navigation";

interface DemoAdminOrderLite {
    id: string;
    symbol: string;
    type: "Buy" | "Sell";
    qty: number;
    price: number;
    status: "Filled" | "Pending" | "Cancelled" | "Rejected";
    time: string;
    date: string;
    pnl: number | null;
    tradeId?: string;
    role?: "Entry" | "Exit" | "Stop" | "TP";
}

export default async function AdminTradeDetailPage({
    params,
}: {
    params: Promise<{ tradeId: string }>;
}) {
    // Next.js (sync dynamic APIs) can provide params/searchParams as Promises.
    // Await before accessing to avoid runtime errors.
    const { tradeId } = await params;
    const trade = demoReviewTrades.find((t) => t.id === tradeId);
    if (!trade) notFound();
    // Keep this explicitly typed to avoid eslint/no-unsafe issues when workspace package types are stale.
    const orders = (demoAdminOrders as unknown as DemoAdminOrderLite[]).filter(
        (o) => o.tradeId === tradeId,
    );
    const relatedEntities = orders.map((o) => ({
        id: o.id,
        label: `Order ${o.id.replace(/^mock-ord-/, "#")}`,
    }));

    const nowSec = Math.floor(Date.now() / 1000);
    const entryMarkerTime = nowSec - 60 * 15 * 55;
    const exitMarkerTime = nowSec - 60 * 15 * 18;
    const tradeMarkers =
        orders.length > 0
            ? orders.slice(0, 2).map((o, idx) => {
                const isBuy = o.type === "Buy";
                return {
                    time: idx === 0 ? entryMarkerTime : exitMarkerTime,
                    position: isBuy ? ("belowBar" as const) : ("aboveBar" as const),
                    color: isBuy ? "#10B981" : "#F43F5E",
                    shape: isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
                    text: isBuy ? "Buy" : "Sell",
                };
            })
            : [
                {
                    time: entryMarkerTime,
                    position: "belowBar" as const,
                    color: "#10B981",
                    shape: "arrowUp" as const,
                    text: "Buy",
                },
                {
                    time: exitMarkerTime,
                    position: "aboveBar" as const,
                    color: "#F43F5E",
                    shape: "arrowDown" as const,
                    text: "Sell",
                },
            ];

    return (
        <div className="animate-in fade-in space-y-6 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                            asChild
                        >
                            <Link href="/admin/dashboard">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Badge
                            variant="outline"
                            className={cn(
                                "border-white/15",
                                trade.reviewed ? "text-emerald-200" : "text-amber-200",
                            )}
                        >
                            {trade.reviewed ? "Reviewed" : "Needs review"}
                        </Badge>
                    </div>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
                        {trade.symbol} • {trade.type}
                    </h1>
                    <p className="mt-1 text-sm text-white/60">
                        {trade.tradeDate} • {trade.date} • {trade.reason}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        className="border-0 bg-orange-600 text-white hover:bg-orange-700"
                        asChild
                    >
                        <Link href="/admin/tradeideas">
                            Open TradeIdeas <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Chart Analysis */}
                    <TradingChartCard
                        title="Chart Analysis"
                        symbol={trade.symbol}
                        height={400}
                        markers={tradeMarkers}
                        timeframes={["15m", "1h", "4h"]}
                    />

                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                            <CardContent className="p-4">
                                <div className="text-muted-foreground text-xs font-medium">
                                    Outcome
                                </div>
                                <div
                                    className={cn(
                                        "mt-1 text-lg font-bold tabular-nums",
                                        trade.pnl >= 0 ? "text-emerald-300" : "text-rose-300",
                                    )}
                                >
                                    {trade.pnl >= 0 ? "+" : ""}
                                    {trade.pnl.toFixed(0)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                            <CardContent className="p-4">
                                <div className="text-muted-foreground text-xs font-medium">
                                    Orders
                                </div>
                                <div className="mt-1 text-lg font-bold tabular-nums">
                                    {orders.length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                            <CardContent className="p-4">
                                <div className="text-muted-foreground text-xs font-medium">
                                    Trade ID
                                </div>
                                <div className="mt-1 text-lg font-bold">{trade.id}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                            <CardContent className="p-4">
                                <div className="text-muted-foreground text-xs font-medium">
                                    Status
                                </div>
                                <div className="mt-1 text-lg font-bold">
                                    {trade.reviewed ? "Reviewed" : "Needs review"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Related Orders */}
                    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-base">Related Orders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {orders.length === 0 ? (
                                <div className="text-sm text-white/60">
                                    No linked orders for this trade yet.
                                </div>
                            ) : (
                                orders.map((o) => (
                                    <Link
                                        key={o.id}
                                        href={`/admin/order/${o.id}`}
                                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <span>{o.symbol}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "border-white/15 text-[10px]",
                                                        o.type === "Buy"
                                                            ? "text-emerald-200"
                                                            : "text-rose-200",
                                                    )}
                                                >
                                                    {o.type}
                                                </Badge>
                                                {o.role ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-white/15 text-[10px] text-white/70"
                                                    >
                                                        {o.role}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 text-xs text-white/60">
                                                {o.date} • {o.time} • {o.status} • Qty {o.qty} @{" "}
                                                {o.price}
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-white/50" />
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <NotesSection
                        entityId={`trade-${tradeId}`}
                        entityLabel="Trade"
                        className="border-white/10 bg-white/3 backdrop-blur-md"
                        relatedEntities={relatedEntities}
                        initialNotes={[
                            {
                                id: `trade-note-${tradeId}-1`,
                                content:
                                    "Review the entry, confirm it matches plan, and annotate the chart with what you saw.",
                                timestamp: Date.now() - 1000 * 60 * 60,
                                entityId: `trade-${tradeId}`,
                                entityLabel: "Trade",
                            },
                        ]}
                    />

                    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Tags</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {["Breakout", "A+ Setup", "Discipline"].map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="border-white/10 bg-white/5 hover:bg-white/10"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

