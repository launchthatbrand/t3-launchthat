"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowUpRight } from "lucide-react";

import { api } from "@convex-config/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Button } from "@acme/ui/button";
import { ReviewsSection } from "~/components/reviews/ReviewsSection";

export default function PublicUserPage() {
  const params = useParams<{ username?: string }>();
  const decoded = decodeURIComponent(String(params.username ?? ""));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const tradeIdeas = useQuery(api.traderlaunchpad.public.listPublicTradeIdeas, {
    username: decoded,
    limit: 50,
  }) as
    | {
        tradeIdeaId: string;
        symbol: string;
        bias: "long" | "short" | "neutral";
        timeframe: string;
        timeframeLabel?: string;
        status: "active" | "closed";
        openedAt: number;
        lastActivityAt: number;
      }[]
    | undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const orders = useQuery(api.traderlaunchpad.public.listPublicOrders, {
    username: decoded,
    limit: 50,
  }) as
    | {
        externalOrderId: string;
        symbol: string;
        side: "buy" | "sell" | null;
        status: string | null;
        createdAt: number | null;
        closedAt: number | null;
      }[]
    | undefined;

  const ideasCount = tradeIdeas?.length ?? 0;
  const ordersCount = orders?.length ?? 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">TradeIdeas</CardTitle>
            <Button asChild variant="outline" className="h-8">
              <Link href={`/u/${encodeURIComponent(decoded)}/tradeideas`}>
                View all <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{tradeIdeas === undefined ? "—" : ideasCount}</div>
            <div className="text-sm text-white/60">Public thesis ideas shared by this user.</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/3 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Orders</CardTitle>
            <Button asChild variant="outline" className="h-8">
              <Link href={`/u/${encodeURIComponent(decoded)}/orders`}>
                View all <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{orders === undefined ? "—" : ordersCount}</div>
            <div className="text-sm text-white/60">Orders shared by this user.</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <ReviewsSection
          target={{ kind: "user", username: decoded }}
          title="Reviews"
          subtitle="Feedback from other traders"
        />
      </div>

      <div className="h-24" />
    </>
  );
}
