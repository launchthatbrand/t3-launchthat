"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@convex-config/_generated/api";
import { useAction } from "convex/react";
import { useParams } from "next/navigation";

interface NewsEventDetail {
  _id: string;
  eventType: string;
  canonicalKey: string;
  title: string;
  summary?: string;
  publishedAt?: number;
  startsAt?: number;
  impact?: string;
  country?: string;
  currency?: string;
  createdAt: number;
  updatedAt: number;
}

interface NewsSourceRef {
  sourceKey: string;
  url?: string;
  externalId?: string;
  createdAt: number;
}

const fmt = (ms: number) => new Date(ms).toLocaleString();

export default function NewsEventPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const getEvent = useAction(api.traderlaunchpad.actions.newsGetEvent);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [event, setEvent] = React.useState<NewsEventDetail | null>(null);
  const [symbols, setSymbols] = React.useState<string[]>([]);
  const [sources, setSources] = React.useState<NewsSourceRef[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = (await getEvent({ eventId })) as any;
        if (cancelled) return;
        if (!res?.ok) {
          setError(typeof res?.error === "string" ? res.error : "Failed to load event");
          setEvent(null);
          setSymbols([]);
          setSources([]);
          return;
        }
        setEvent(res?.event ?? null);
        const rawSymbols: unknown[] = Array.isArray(res?.symbols) ? res.symbols : [];
        const normalizedSymbols = rawSymbols
          .map((s): string => {
            if (typeof s === "string") return s;
            if (s && typeof s === "object" && typeof (s as any).symbol === "string") {
              return String((s as any).symbol);
            }
            return "";
          })
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        setSymbols(Array.from(new Set(normalizedSymbols)));
        setSources(Array.isArray(res?.sources) ? res.sources : []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load event");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (eventId) void run();
    return () => {
      cancelled = true;
    };
  }, [eventId, getEvent]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <Link href="/news" className="hover:text-foreground">
            News
          </Link>{" "}
          / <span className="font-mono">{eventId}</span>
        </div>
      </div>

      {loading ? (
        <Card className="border-border/40 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : error ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-sm text-foreground/80">
          {error}
        </div>
      ) : !event ? (
        <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-sm text-muted-foreground">
          Event not found.
        </div>
      ) : (
        <Card className="border-border/40 bg-card/70 backdrop-blur-md">
          <CardHeader className="border-b border-border/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{event.title}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {event.eventType === "economic" && typeof event.startsAt === "number"
                    ? `Starts: ${fmt(event.startsAt)}`
                    : typeof event.publishedAt === "number"
                      ? `Published: ${fmt(event.publishedAt)}`
                      : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.eventType}</Badge>
                {event.impact ? <Badge variant="secondary">{event.impact}</Badge> : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {event.summary ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{event.summary}</div>
            ) : null}

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Linked symbols</div>
              {symbols.length === 0 ? (
                <div className="text-xs text-muted-foreground">No linked symbols.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {symbols.map((s) => (
                    <Link key={s} href={`/symbol/${encodeURIComponent(s)}`} className="inline-flex">
                      <Badge variant="secondary" className="hover:bg-secondary/70">
                        {s}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {event.currency ? <Badge variant="outline">{event.currency}</Badge> : null}
              {event.country ? <Badge variant="outline">{event.country}</Badge> : null}
            </div>

            <div className="rounded-xl border border-border/40 bg-background/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground">Provenance</div>
              {sources.length === 0 ? (
                <div className="mt-2 text-xs text-muted-foreground">No sources recorded.</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {sources.slice(0, 10).map((s) => (
                    <div key={`${s.sourceKey}:${s.createdAt}`} className="text-xs">
                      <span className="font-mono">{s.sourceKey}</span>
                      {s.url ? (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                          >
                            link
                          </a>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/40 bg-background/40 p-3">
              <div className="text-xs font-semibold text-muted-foreground">IDs</div>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <div>
                  <span className="font-mono">eventId</span>:{" "}
                  <span className="font-mono">{event._id}</span>
                </div>
                <div>
                  <span className="font-mono">canonicalKey</span>:{" "}
                  <span className="font-mono break-all">{event.canonicalKey}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

