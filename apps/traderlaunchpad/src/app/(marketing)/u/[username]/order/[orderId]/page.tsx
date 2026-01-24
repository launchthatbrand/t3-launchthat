import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { demoAdminOrders, demoPublicProfiles, demoPublicUsers } from "@acme/demo-data";

import { Badge } from "@acme/ui/badge";
import React from "react";
import { TradingChartCard } from "~/components/charts/TradingChartCard";
import { cn } from "@acme/ui";
import { notFound } from "next/navigation";

interface PublicUser {
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio: string;
    isPublic: boolean;
    primaryBroker: string;
}

interface PublicProfileOnly {
    username: string;
    avatarUrl?: string;
}

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

export default async function PublicUserOrderDetailPage({
    params,
}: {
    params: Promise<{ username: string; orderId: string }>;
}) {
    const { username, orderId } = await params;
    const decoded = decodeURIComponent(username);

    const users = demoPublicUsers as unknown as PublicUser[];
    const user = users.find((u) => u.username.toLowerCase() === decoded.toLowerCase());
    const profiles = demoPublicProfiles as unknown as PublicProfileOnly[];
    const profileOnly = profiles.find((p) => p.username.toLowerCase() === decoded.toLowerCase());
    if (!user && !profileOnly) return notFound();
    if (user && !user.isPublic) return notFound();

    const order = (demoAdminOrders as unknown as DemoAdminOrderLite[]).find((o) => o.id === orderId);
    if (!order) return notFound();

    const nowSec = Math.floor(Date.now() / 1000);
    const markerTime = nowSec - 60 * 15 * 32;
    const isBuy = order.type === "Buy";
    const markers = [
        {
            time: markerTime,
            position: isBuy ? ("belowBar" as const) : ("aboveBar" as const),
            color: isBuy ? "#10B981" : "#F43F5E",
            shape: isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
            text: order.type,
        },
    ];

    const displayName = user?.displayName ?? profileOnly?.username ?? decoded;

    return (
        <>
            <div className="mb-4">
                <div className="text-sm text-white/55">@{decoded}</div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    {displayName} — Order
                </h2>
                <div className="mt-2 text-sm text-white/60">
                    {order.symbol} • {order.date}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <TradingChartCard
                                title="Chart"
                                symbol={order.symbol}
                                height={380}
                                markers={markers}
                                timeframes={["15m", "1h", "4h"]}
                            />

                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <div className="text-muted-foreground text-xs font-medium">Type</div>
                                        <div
                                            className={cn(
                                                "mt-1 text-lg font-bold",
                                                isBuy ? "text-emerald-300" : "text-rose-300",
                                            )}
                                        >
                                            {order.type}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <div className="text-muted-foreground text-xs font-medium">Qty</div>
                                        <div className="mt-1 text-lg font-bold tabular-nums">{order.qty}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <div className="text-muted-foreground text-xs font-medium">Price</div>
                                        <div className="mt-1 text-lg font-bold tabular-nums">{order.price}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                    <CardContent className="p-4">
                                        <div className="text-muted-foreground text-xs font-medium">Status</div>
                                        <div className="mt-1 text-lg font-bold">{order.status}</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-base">Order details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Symbol</span>
                                        <span className="font-medium text-white/90">{order.symbol}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Time</span>
                                        <span className="font-medium text-white/90">
                                            {order.date} • {order.time}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">Role</span>
                                        <span className="font-medium text-white/90">{order.role ?? "—"}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/60">PnL</span>
                                        <span
                                            className={cn(
                                                "font-medium",
                                                (order.pnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200",
                                            )}
                                        >
                                            {order.pnl === null
                                                ? "—"
                                                : order.pnl >= 0
                                                    ? `+$${order.pnl}`
                                                    : `-$${Math.abs(order.pnl)}`}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-white/60">
                                    Notes are available in the admin journal. (Public notes coming soon.)
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="h-24" />
        </>
    );
}

