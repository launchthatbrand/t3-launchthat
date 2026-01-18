import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  demoAdminOrders,
  demoPublicProfiles,
  demoPublicUsers,
  demoReviewTrades,
} from "@acme/demo-data";

import { AffiliatePageShell } from "../../../../../components/affiliates/AffiliatePageShell";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { cn } from "@acme/ui";
import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

interface PublicUser {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  isPublic: boolean;
  primaryBroker: string;
  recentTrades: {
    id: string;
    symbol: string;
    side: "Long" | "Short";
    dateLabel: string;
    pnl: number;
    rMultiple: number;
    setup: string;
  }[];
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

const getTradeIdForPublicTrade = (t: { symbol: string; side: "Long" | "Short" }) => {
  const match = demoReviewTrades.find((rt) => rt.symbol === t.symbol && rt.type === t.side);
  if (match) return match.id;
  const idx =
    Math.abs(Array.from(t.symbol).reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    demoReviewTrades.length;
  return demoReviewTrades[idx]?.id ?? "1";
};

export default async function PublicUserOrdersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const users = demoPublicUsers as unknown as PublicUser[];
  const user = users.find((u) => u.username.toLowerCase() === decoded.toLowerCase());

  const profiles = demoPublicProfiles as unknown as PublicProfileOnly[];
  const profileOnly = profiles.find((p) => p.username.toLowerCase() === decoded.toLowerCase());

  if (!user && !profileOnly) return notFound();
  if (user && !user.isPublic) return notFound();

  const displayName = user?.displayName ?? profileOnly?.username ?? decoded;

  const tradeIds = new Set<string>(
    (user?.recentTrades ?? []).map((t) => getTradeIdForPublicTrade(t)),
  );
  const allOrders = demoAdminOrders as unknown as DemoAdminOrderLite[];
  const orders = allOrders.filter((o) => (o.tradeId ? tradeIds.has(o.tradeId) : false));

  return (
    <AffiliatePageShell title={`${displayName} — Orders`} subtitle={`@${decoded} • Public orders`}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href={`/u/${encodeURIComponent(decoded)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to profile
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <Link href={`/u/${encodeURIComponent(decoded)}/trades`} className="hover:text-white">
            Trades
          </Link>
          <span className="text-white/20">•</span>
          <Link href={`/u/${encodeURIComponent(decoded)}/tradeideas`} className="hover:text-white">
            TradeIdeas
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/3 p-7 backdrop-blur-md">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/85">Orders</div>
            <div className="mt-1 text-sm text-white/55">
              Filled orders that make up the public trades for this user.
            </div>
          </div>
          <div className="text-xs text-white/50">{orders.length} orders</div>
        </div>

        <div className="mt-5 grid gap-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
              No public orders yet.
            </div>
          ) : (
            orders.map((o) => (
              <Link
                key={o.id}
                href={`/u/${encodeURIComponent(decoded)}/order/${o.id}`}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white/90">{o.symbol}</div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-white/15 text-[10px]",
                        o.type === "Buy" ? "text-emerald-200" : "text-rose-200",
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
                    <div className="text-xs text-white/45">
                      {o.date} • {o.time}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-white/55">
                    Qty {o.qty} @ {o.price} • {o.status}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs text-white/50">View</div>
                  <div className="mt-0.5 inline-flex items-center gap-2 text-xs text-white/60 group-hover:text-white">
                    Order <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

