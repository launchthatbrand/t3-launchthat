"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Flag, Loader2, Search } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { PublicSymbolPricePanel } from "~/components/price/PublicSymbolPricePanel";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui/lib/utils";
import { useAction } from "convex/react";
import { Skeleton } from "@acme/ui/skeleton";

type SideTab = "watchlist" | "details" | "trade";
type BottomTab = "positions" | "orders" | "fills" | "alerts";
interface SourceOption {
  sourceKey: string;
  label: string;
  isDefault?: boolean;
}

export function PublicSymbolTradingPanel({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listSources = useAction(api.traderlaunchpad.actions.pricedataListPublicSources);
  const listSymbolsForSourceKey = useAction(
    api.traderlaunchpad.actions.pricedataListPublicSymbolsForSourceKey,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const listNewsForSymbol = useAction(api.traderlaunchpad.actions.newsListForSymbol);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const setNewsSubscription = useAction(api.traderlaunchpad.actions.newsSetSubscription);

  const [sources, setSources] = React.useState<SourceOption[]>([]);
  const [selectedSourceKey, setSelectedSourceKey] = React.useState<string | null>(
    null,
  );
  const [symbols, setSymbols] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [favoriteSet, setFavoriteSet] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [pendingSymbol, setPendingSymbol] = React.useState<string | null>(null);

  const [newsLoading, setNewsLoading] = React.useState(false);
  const [newsAllowed, setNewsAllowed] = React.useState(true);
  const [newsUpcomingEconomic, setNewsUpcomingEconomic] = React.useState<
    { eventId: string; at: number; title: string; impact?: string; currency?: string }[]
  >([]);
  const [newsRecentHeadlines, setNewsRecentHeadlines] = React.useState<
    { eventId: string; at: number; title: string; summary?: string }[]
  >([]);
  const [newsSubscribed, setNewsSubscribed] = React.useState(false);

  const urlSourceKey = searchParams.get("sourceKey");
  const urlSideTab = (searchParams.get("sideTab") ?? "") as SideTab;
  const urlBottomTab = (searchParams.get("bottomTab") ?? "") as BottomTab;

  const [sideTab, setSideTab] = React.useState<SideTab>(
    urlSideTab === "details" || urlSideTab === "trade" ? urlSideTab : "watchlist",
  );
  const [bottomTab, setBottomTab] = React.useState<BottomTab>(
    urlBottomTab === "orders" || urlBottomTab === "fills" || urlBottomTab === "alerts"
      ? urlBottomTab
      : "positions",
  );

  const favoritesStorageKey = selectedSourceKey
    ? `publicTradingPanel:favorites:${selectedSourceKey}`
    : null;

  // Keep URL state in sync (and also adopt URL changes if user uses back/forward).
  React.useEffect(() => {
    const nextSide: SideTab =
      urlSideTab === "details" || urlSideTab === "trade" ? urlSideTab : "watchlist";
    const nextBottom: BottomTab =
      urlBottomTab === "orders" || urlBottomTab === "fills" || urlBottomTab === "alerts"
        ? urlBottomTab
        : "positions";
    if (nextSide !== sideTab) setSideTab(nextSide);
    if (nextBottom !== bottomTab) setBottomTab(nextBottom);
  }, [bottomTab, sideTab, urlBottomTab, urlSideTab]);

  const replaceUrlParam = React.useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v) sp.delete(k);
        else sp.set(k, v);
      }
      router.replace(`/symbol/${encodeURIComponent(symbol)}?${sp.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, symbol],
  );

  React.useEffect(() => {
    // Ensure URL contains full state defaults for shareability.
    const needsSide = !searchParams.get("sideTab");
    const needsBottom = !searchParams.get("bottomTab");
    if (!needsSide && !needsBottom) return;
    replaceUrlParam({
      ...(needsSide ? { sideTab } : {}),
      ...(needsBottom ? { bottomTab } : {}),
    });
  }, [bottomTab, replaceUrlParam, searchParams, sideTab]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setNewsLoading(true);
      try {
        const res = (await listNewsForSymbol({
          symbol,
          horizonDays: 7,
          lookbackHours: 48,
        })) as any;
        if (cancelled) return;
        setNewsAllowed(Boolean(res?.allowed ?? true));
        setNewsUpcomingEconomic(Array.isArray(res?.upcomingEconomic) ? res.upcomingEconomic : []);
        setNewsRecentHeadlines(Array.isArray(res?.recentHeadlines) ? res.recentHeadlines : []);
        setNewsSubscribed(false);
      } catch {
        if (cancelled) return;
        setNewsAllowed(true);
        setNewsUpcomingEconomic([]);
        setNewsRecentHeadlines([]);
        setNewsSubscribed(false);
      } finally {
        if (cancelled) return;
        setNewsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [listNewsForSymbol, symbol]);

  React.useEffect(() => {
    if (!favoritesStorageKey) return;
    try {
      const raw = window.localStorage.getItem(favoritesStorageKey);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      const list = Array.isArray(arr)
        ? arr
          .map((s) => (typeof s === "string" ? s.trim().toUpperCase() : ""))
          .filter(Boolean)
        : [];
      setFavoriteSet(new Set(list));
    } catch {
      setFavoriteSet(new Set());
    }
  }, [favoritesStorageKey]);

  const toggleFavorite = React.useCallback(
    (sym: string) => {
      const k = sym.trim().toUpperCase();
      if (!k || !favoritesStorageKey) return;
      setFavoriteSet((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        try {
          window.localStorage.setItem(
            favoritesStorageKey,
            JSON.stringify(Array.from(next)),
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [favoritesStorageKey],
  );

  React.useEffect(() => {
    let cancelled = false;
    listSources({ limit: 50 })
      .then((rowsUnknown: unknown) => {
        if (cancelled) return;
        const next: SourceOption[] = [];
        if (Array.isArray(rowsUnknown)) {
          for (const r of rowsUnknown) {
            const obj = r as Record<string, unknown>;
            const sourceKey = typeof obj.sourceKey === "string" ? obj.sourceKey : "";
            if (!sourceKey) continue;
            const label = typeof obj.label === "string" ? obj.label : sourceKey;
            const isDefault = obj.isDefault === true ? true : undefined;
            next.push({ sourceKey, label, ...(isDefault ? { isDefault } : {}) });
          }
        }

        setSources(next);

        const preferred =
          typeof urlSourceKey === "string" && urlSourceKey
            ? next.find((s) => s.sourceKey === urlSourceKey)?.sourceKey ?? null
            : null;

        const fallback =
          next.find((s) => s.isDefault)?.sourceKey ??
          next[0]?.sourceKey ??
          null;

        const chosen: string | null = preferred ?? fallback;
        setSelectedSourceKey(chosen);

        if (!preferred && chosen) {
          replaceUrlParam({ sourceKey: chosen });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listSources, urlSourceKey, replaceUrlParam]);

  React.useEffect(() => {
    const k = selectedSourceKey;
    if (!k) {
      setSymbols([]);
      return;
    }
    let cancelled = false;
    listSymbolsForSourceKey({ sourceKey: k, limit: 5000 })
      .then((resUnknown: unknown) => {
        if (cancelled) return;
        const obj = (resUnknown ?? {}) as Record<string, unknown>;
        const nextSymbols = Array.isArray(obj.symbols)
          ? obj.symbols
            .map((s) => (typeof s === "string" ? s : ""))
            .filter(Boolean)
          : [];
        setSymbols(nextSymbols);
      })
      .catch(() => {
        if (cancelled) return;
        setSymbols([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listSymbolsForSourceKey, selectedSourceKey]);

  const filteredSymbols = React.useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? symbols.filter((s) => s.includes(q)) : symbols;
    const fav: string[] = [];
    const rest: string[] = [];
    for (const s of base) {
      if (favoriteSet.has(s)) fav.push(s);
      else rest.push(s);
    }
    return { fav, rest };
  }, [favoriteSet, search, symbols]);

  const handleSelectSourceKey = React.useCallback(
    (next: string) => {
      const trimmed = next.trim();
      if (!trimmed) return;
      setSelectedSourceKey(trimmed);
      replaceUrlParam({ sourceKey: trimmed });
    },
    [replaceUrlParam],
  );

  React.useEffect(() => {
    // Clear pending click feedback once the route param updates.
    setPendingSymbol(null);
  }, [symbol]);

  return (
    <div className={cn("w-full", className)}>
      <ResizablePanelGroup
        direction="vertical"
        className="h-[72vh] min-h-[640px] overflow-hidden rounded-3xl border border-border/40 bg-card/70 text-foreground backdrop-blur-md"
      >
        <ResizablePanel defaultSize={72} minSize={45}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={74} minSize={55}>
              <div className="h-full p-3">
                <PublicSymbolPricePanel
                  symbol={symbol}
                  selectedSourceKey={selectedSourceKey}
                  sourceOptions={sources}
                  onSelectedSourceKeyChangeAction={handleSelectSourceKey}
                  externalLoading={Boolean(pendingSymbol && pendingSymbol !== symbol)}
                  fillHeight
                  className="h-full min-h-0 overflow-hidden rounded-2xl border-border/40 bg-card/70"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={26} minSize={18} maxSize={40}>
              <div className="h-full p-3">
                <Card className="flex h-full flex-col overflow-hidden border-border/40 bg-card/70 backdrop-blur-md">
                  <CardHeader className="border-b border-border/40 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Panel</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        Demo
                      </Badge>
                    </div>
                  </CardHeader>

                  <Tabs
                    value={sideTab}
                    onValueChange={(v) => {
                      const next =
                        v === "details" || v === "trade" ? (v as SideTab) : ("watchlist" as SideTab);
                      setSideTab(next);
                      replaceUrlParam({ sideTab: next });
                    }}
                    className="flex h-full flex-col"
                  >
                    <CardContent className="border-b border-border/40 px-3 py-2">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="watchlist">Watch</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="trade">Trade</TabsTrigger>
                      </TabsList>
                    </CardContent>

                    <TabsContent
                      value="watchlist"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search symbols..."
                            className="h-9 pl-9"
                          />
                        </div>

                        {filteredSymbols.fav.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-muted-foreground">
                              Favorites
                            </div>
                            {filteredSymbols.fav.map((s) => (
                              <div
                                key={s}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5",
                                  s === symbol ? "ring-1 ring-ring/30" : "",
                                )}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (s === symbol) {
                                    setPendingSymbol(null);
                                    return;
                                  }
                                  setPendingSymbol(s);
                                  const sp = new URLSearchParams(searchParams.toString());
                                  if (selectedSourceKey) sp.set("sourceKey", selectedSourceKey);
                                  router.push(
                                    `/symbol/${encodeURIComponent(s)}?${sp.toString()}`,
                                    { scroll: false },
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return;
                                  e.preventDefault();
                                  if (s === symbol) {
                                    setPendingSymbol(null);
                                    return;
                                  }
                                  setPendingSymbol(s);
                                  const sp = new URLSearchParams(searchParams.toString());
                                  if (selectedSourceKey) sp.set("sourceKey", selectedSourceKey);
                                  router.push(
                                    `/symbol/${encodeURIComponent(s)}?${sp.toString()}`,
                                    { scroll: false },
                                  );
                                }}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <button
                                    type="button"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/60 text-muted-foreground hover:bg-foreground/5"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFavorite(s);
                                    }}
                                    aria-label="Toggle favorite"
                                  >
                                    <Flag
                                      className={cn(
                                        "h-4 w-4",
                                        favoriteSet.has(s)
                                          ? "text-orange-500"
                                          : "text-muted-foreground/60",
                                      )}
                                    />
                                  </button>
                                  <span className="min-w-0 truncate font-mono">
                                    {s}
                                  </span>
                                </span>
                                {pendingSymbol === s ? (
                                  <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Loading
                                  </span>
                                ) : s === symbol ? (
                                  <span className="text-xs text-muted-foreground">
                                    Viewing
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Open
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          {filteredSymbols.fav.length > 0 ? (
                            <div className="text-[11px] font-semibold text-muted-foreground">
                              All
                            </div>
                          ) : null}
                          {filteredSymbols.rest.map((s) => (
                            <div
                              key={s}
                              className={cn(
                                "flex w-full items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-left text-sm text-foreground hover:bg-foreground/5",
                                s === symbol ? "ring-1 ring-ring/30" : "",
                                pendingSymbol === s ? "opacity-80" : "",
                              )}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                if (s === symbol) {
                                  setPendingSymbol(null);
                                  return;
                                }
                                setPendingSymbol(s);
                                const sp = new URLSearchParams(searchParams.toString());
                                if (selectedSourceKey) sp.set("sourceKey", selectedSourceKey);
                                router.push(
                                  `/symbol/${encodeURIComponent(s)}?${sp.toString()}`,
                                  { scroll: false },
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" && e.key !== " ") return;
                                e.preventDefault();
                                if (s === symbol) {
                                  setPendingSymbol(null);
                                  return;
                                }
                                setPendingSymbol(s);
                                const sp = new URLSearchParams(searchParams.toString());
                                if (selectedSourceKey) sp.set("sourceKey", selectedSourceKey);
                                router.push(
                                  `/symbol/${encodeURIComponent(s)}?${sp.toString()}`,
                                  { scroll: false },
                                );
                              }}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/60 text-muted-foreground hover:bg-foreground/5"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite(s);
                                  }}
                                  aria-label="Toggle favorite"
                                >
                                  <Flag
                                    className={cn(
                                      "h-4 w-4",
                                      favoriteSet.has(s)
                                        ? "text-orange-300"
                                        : "text-muted-foreground/50",
                                    )}
                                  />
                                </button>
                                <span className="min-w-0 truncate font-mono">
                                  {s}
                                </span>
                              </span>
                              {pendingSymbol === s ? (
                                <span className="inline-flex items-center gap-2 text-xs text-white/50">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Loading
                                </span>
                              ) : s === symbol ? (
                                <span className="text-xs text-white/50">
                                  Viewing
                                </span>
                              ) : (
                                <span className="text-xs text-white/50">
                                  Open
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="details"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Instrument
                          </div>
                          <div className="mt-1 font-mono text-sm text-foreground">
                            {symbol}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Status
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Public ClickHouse cache (MVP)
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Notes
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            This sidebar becomes accounts, order ticket, DOM,
                            alerts, etc.
                          </div>
                        </div>

                        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-muted-foreground">
                              News
                            </div>
                            <Link
                              href="/news"
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              View all
                            </Link>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-muted-foreground">
                              Alerts
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "inline-flex h-7 items-center rounded-md border px-2 text-[11px]",
                                newsSubscribed
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                  : "border-border/40 bg-background/60 text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                              )}
                              onClick={() =>
                                void (async () => {
                                  const next = !newsSubscribed;
                                  setNewsSubscribed(next);
                                  try {
                                    await setNewsSubscription({
                                      symbol,
                                      enabled: next,
                                      channels: { inApp: true },
                                      cooldownSeconds: 300,
                                    });
                                  } catch {
                                    // revert on failure
                                    setNewsSubscribed(!next);
                                  }
                                })()
                              }
                            >
                              {newsSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                          </div>

                          {newsLoading ? (
                            <div className="mt-3 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-14 w-full" />
                              <Skeleton className="h-14 w-full" />
                            </div>
                          ) : !newsAllowed ? (
                            <div className="mt-2 text-xs text-muted-foreground">
                              News is limited to symbols supported in price data.
                            </div>
                          ) : newsUpcomingEconomic.length === 0 &&
                            newsRecentHeadlines.length === 0 ? (
                            <div className="mt-2 text-xs text-muted-foreground">
                              No events for this symbol yet.
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {newsUpcomingEconomic.length > 0 ? (
                                <div>
                                  <div className="text-[11px] font-semibold text-muted-foreground">
                                    Upcoming
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    {newsUpcomingEconomic.slice(0, 3).map((e) => (
                                      <div
                                        key={e.eventId}
                                        className="rounded-lg border border-border/40 bg-background/50 p-2"
                                      >
                                        <div className="text-xs font-medium text-foreground">
                                          {e.title}
                                        </div>
                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                          {new Date(e.at).toLocaleString()}
                                          {e.currency ? ` • ${e.currency}` : ""}
                                          {e.impact ? ` • ${e.impact}` : ""}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {newsRecentHeadlines.length > 0 ? (
                                <div>
                                  <div className="text-[11px] font-semibold text-muted-foreground">
                                    Headlines
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    {newsRecentHeadlines.slice(0, 3).map((e) => (
                                      <div
                                        key={e.eventId}
                                        className="rounded-lg border border-border/40 bg-background/50 p-2"
                                      >
                                        <div className="text-xs font-medium text-foreground">
                                          {e.title}
                                        </div>
                                        {e.summary ? (
                                          <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                            {e.summary}
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="trade"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                          <div className="text-xs font-semibold text-muted-foreground">
                            Order ticket (MVP)
                          </div>
                          <div className="mt-3 grid gap-3">
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Size
                              </Label>
                              <Input
                                defaultValue="0.01"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Stop loss
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-muted-foreground">
                                Take profit
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="grid grid-cols-2 gap-2">
                              <Button className="h-9 bg-emerald-600 hover:bg-emerald-700">
                                Buy
                              </Button>
                              <Button className="h-9 bg-rose-600 hover:bg-rose-700">
                                Sell
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              MVP only — no broker execution yet.
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="h-full p-3">
            <Card className="h-full overflow-hidden border-border/40 bg-card/70 backdrop-blur-md">
              <Tabs
                value={bottomTab}
                onValueChange={(v) => {
                  const next =
                    v === "orders" || v === "fills" || v === "alerts"
                      ? (v as BottomTab)
                      : ("positions" as BottomTab);
                  setBottomTab(next);
                  replaceUrlParam({ bottomTab: next });
                }}
                className="flex h-full flex-col"
              >
                <CardHeader className="border-b border-border/40 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <TabsList className="grid w-[420px] grid-cols-4">
                      <TabsTrigger value="positions">Positions</TabsTrigger>
                      <TabsTrigger value="orders">Orders</TabsTrigger>
                      <TabsTrigger value="fills">Fills</TabsTrigger>
                      <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    </TabsList>
                    <div className="text-xs text-muted-foreground">
                      {symbol} • demo data
                    </div>
                  </div>
                </CardHeader>

                <TabsContent value="positions" className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instrument</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Entry</TableHead>
                        <TableHead className="text-right">PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono">{symbol}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-600">Long</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          0.01
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          89320.5
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-500">
                          +12.40
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="orders" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-muted-foreground">
                    No open orders (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="fills" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-muted-foreground">
                    Fill history will go here (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-muted-foreground">
                    Alerts & notifications will go here (MVP).
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

