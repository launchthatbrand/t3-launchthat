"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Sparkles } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { api } from "@convex-config/_generated/api";
import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";

type NextToReviewRow = {
  tradeIdeaGroupId: string;
  symbol: string;
  direction: "long" | "short";
  closedAt: number;
  realizedPnl?: number;
  reviewStatus: "todo" | "reviewed";
};

const formatAge = (ms: number) => {
  const delta = Date.now() - ms;
  if (delta < 60_000) return "just now";
  const min = Math.floor(delta / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
};

export default function OnboardingFirstReviewPage() {
  const status = useOnboardingStatus();
  const nextToReview = useQuery(api.traderlaunchpad.queries.listMyNextTradeIdeasToReview, {
    limit: 3,
  }) as NextToReviewRow[] | undefined;

  const first = Array.isArray(nextToReview) ? nextToReview[0] : undefined;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Step 3: Review your first TradeIdea</span>
            {status.reviewOk ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                Done
              </Badge>
            ) : (
              <Badge variant="outline">Pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Habit loop
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Review turns randomness into pattern recognition. This is where you improve.
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="h-4 w-4 text-blue-500" />
                Structured notes
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Thesis, setup, mistakes, outcome, and what to do next time.
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Build your playbook
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Over time you’ll see which setups are actually profitable.
              </div>
            </div>
          </div>

          {nextToReview === undefined ? (
            <div className="text-muted-foreground text-sm">Loading your next trades…</div>
          ) : nextToReview.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="text-sm font-semibold">Nothing to review yet</div>
              <div className="text-muted-foreground mt-1 text-sm">
                Run a sync and come back. Once you have closed TradeIdeas, they’ll appear here.
              </div>
              <div className="mt-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/onboarding/sync">Go back to Sync</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {nextToReview.map((row) => (
                <Link
                  key={row.tradeIdeaGroupId}
                  href={`/admin/tradeidea/${encodeURIComponent(row.tradeIdeaGroupId)}`}
                  className="bg-card hover:bg-card/80 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{row.symbol}</div>
                      <Badge variant="outline">
                        {row.direction === "long" ? "Long" : "Short"}
                      </Badge>
                      <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
                        Needs review
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Closed {formatAge(row.closedAt)}
                      {typeof row.realizedPnl === "number"
                        ? ` • P&L ${row.realizedPnl.toFixed(2)}`
                        : ""}
                    </div>
                  </div>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Next step</div>
              <div className="text-muted-foreground text-sm">
                Open a TradeIdea and click “Mark reviewed” to complete onboarding.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/tradeideas?status=closed">Browse TradeIdeas</Link>
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                asChild
                disabled={!first}
              >
                <Link
                  href={
                    first
                      ? `/admin/tradeidea/${encodeURIComponent(first.tradeIdeaGroupId)}`
                      : "/admin/tradeideas?status=closed"
                  }
                >
                  Review now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

