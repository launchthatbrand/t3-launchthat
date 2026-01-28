"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@convex-config/_generated/api";
import { useAction } from "convex/react";

interface NewsEventRow {
  _id: string;
  eventType: string;
  title: string;
  summary?: string;
  publishedAt?: number;
  startsAt?: number;
  impact?: string;
  country?: string;
  currency?: string;
}

const fmt = (ms: number) => new Date(ms).toLocaleString();

export default function NewsPage() {
  const listGlobal = useAction(api.traderlaunchpad.actions.newsListGlobal);
  const [loading, setLoading] = React.useState(true);
  const [headlines, setHeadlines] = React.useState<NewsEventRow[]>([]);
  const [economic, setEconomic] = React.useState<NewsEventRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError(null);
      setLoading(true);
      try {
        const now = Date.now();
        const econ = (await listGlobal({
          eventType: "economic",
          fromMs: now,
          toMs: now + 14 * 24 * 60 * 60 * 1000,
          limit: 200,
        })) as unknown;
        const head = (await listGlobal({
          eventType: "headline",
          fromMs: now - 7 * 24 * 60 * 60 * 1000,
          toMs: now,
          limit: 200,
        })) as unknown;

        if (cancelled) return;
        setEconomic(Array.isArray(econ) ? (econ as NewsEventRow[]) : []);
        setHeadlines(Array.isArray(head) ? (head as NewsEventRow[]) : []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load news");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [listGlobal]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div>
        <div className="text-2xl font-semibold tracking-tight">News</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Economic calendar + headlines for symbols supported in price data.
          {" "}
          <Link href="/news/forex/calendar" className="underline underline-offset-4 hover:text-foreground">
            Forex calendar
          </Link>
          .
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-sm text-foreground/80">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/40 bg-card/70 backdrop-blur-md">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm">Upcoming economic events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {loading ? (
              <>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : economic.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming events.</div>
            ) : (
              economic.slice(0, 30).map((e) => (
                <Link
                  key={e._id}
                  href={`/news/${encodeURIComponent(e._id)}`}
                  className="block rounded-xl border border-border/40 bg-background/40 p-3 hover:bg-foreground/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{e.title}</div>
                    <Badge variant="secondary" className="text-[11px]">
                      {e.impact ?? "impact?"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(typeof e.startsAt === "number" && e.startsAt > 0) ? fmt(e.startsAt) : ""}
                    {e.currency ? ` • ${e.currency}` : ""}
                    {e.country ? ` • ${e.country}` : ""}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/70 backdrop-blur-md">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm">Recent headlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {loading ? (
              <>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : headlines.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent headlines.</div>
            ) : (
              headlines.slice(0, 30).map((e) => (
                <Link
                  key={e._id}
                  href={`/news/${encodeURIComponent(e._id)}`}
                  className="block rounded-xl border border-border/40 bg-background/40 p-3 hover:bg-foreground/5"
                >
                  <div className="text-sm font-medium text-foreground">{e.title}</div>
                  {e.summary ? (
                    <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {e.summary}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {(typeof e.publishedAt === "number" && e.publishedAt > 0) ? fmt(e.publishedAt) : ""}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

