"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@acme/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Badge } from "@acme/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { cn } from "@acme/ui/lib/utils";
import { PublicSymbolPricePanel } from "~/components/price/PublicSymbolPricePanel";
import { useRouter, useSearchParams } from "next/navigation";
import { Flag, Search, Loader2 } from "lucide-react";

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

  const [sources, setSources] = React.useState<
    Array<{ sourceKey: string; label: string; isDefault?: boolean }>
  >([]);
  const [selectedSourceKey, setSelectedSourceKey] = React.useState<string | null>(
    null,
  );
  const [symbols, setSymbols] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [favoriteSet, setFavoriteSet] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [pendingSymbol, setPendingSymbol] = React.useState<string | null>(null);

  const urlSourceKey = searchParams.get("sourceKey");
  const favoritesStorageKey = selectedSourceKey
    ? `publicTradingPanel:favorites:${selectedSourceKey}`
    : null;

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
      .then((rows) => {
        if (cancelled) return;
        const next = Array.isArray(rows) ? rows : [];
        setSources(next);

        const preferred =
          typeof urlSourceKey === "string" && urlSourceKey
            ? next.find((s) => s.sourceKey === urlSourceKey)?.sourceKey ?? null
            : null;

        const fallback =
          next.find((s) => s.isDefault)?.sourceKey ??
          next[0]?.sourceKey ??
          null;

        const chosen = preferred ?? fallback;
        setSelectedSourceKey(chosen);

        if (!preferred && chosen) {
          const sp = new URLSearchParams(searchParams.toString());
          sp.set("sourceKey", chosen);
          router.replace(`/symbol/${encodeURIComponent(symbol)}?${sp.toString()}`, {
            scroll: false,
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSources([]);
      });
    return () => {
      cancelled = true;
    };
    // Intentionally exclude router/searchParams from deps to avoid replace loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listSources, urlSourceKey]);

  React.useEffect(() => {
    const k = selectedSourceKey;
    if (!k) {
      setSymbols([]);
      return;
    }
    let cancelled = false;
    listSymbolsForSourceKey({ sourceKey: k, limit: 5000 })
      .then((res) => {
        if (cancelled) return;
        setSymbols(Array.isArray(res?.symbols) ? res.symbols : []);
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
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("sourceKey", trimmed);
      router.replace(`/symbol/${encodeURIComponent(symbol)}?${sp.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, symbol],
  );

  React.useEffect(() => {
    // Clear pending click feedback once the route param updates.
    setPendingSymbol(null);
  }, [symbol]);

  return (
    <div className={cn("w-full", className)}>
      <ResizablePanelGroup
        direction="vertical"
        className="h-[72vh] min-h-[640px] overflow-hidden rounded-3xl border border-white/10 bg-black/20"
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
                  className="h-full min-h-0 rounded-2xl border-white/10 bg-white/3 p-4"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={26} minSize={18} maxSize={40}>
              <div className="h-full p-3">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="text-sm font-semibold text-white/85">
                      Panel
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Demo
                    </Badge>
                  </div>

                  <Tabs defaultValue="watchlist" className="flex h-full flex-col">
                    <div className="border-b border-white/10 px-3 py-2">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="watchlist">Watch</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="trade">Trade</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent
                      value="watchlist"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                          <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search symbols..."
                            className="h-9 pl-9"
                          />
                        </div>

                        {filteredSymbols.fav.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-white/50">
                              Favorites
                            </div>
                            {filteredSymbols.fav.map((s) => (
                              <div
                                key={s}
                                className={cn(
                                  "flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white/80 hover:bg-black/30",
                                  s === symbol ? "ring-1 ring-white/20" : "",
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
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/30 hover:bg-black/40"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFavorite(s);
                                    }}
                                    aria-label="Toggle favorite"
                                  >
                                    <Flag className="h-4 w-4 text-rose-300" />
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
                        ) : null}

                        <div className="space-y-2">
                          {filteredSymbols.fav.length > 0 ? (
                            <div className="text-[11px] font-semibold text-white/50">
                              All
                            </div>
                          ) : null}
                          {filteredSymbols.rest.map((s) => (
                          <div
                            key={s}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white/80 hover:bg-black/30",
                              s === symbol ? "ring-1 ring-white/20" : "",
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
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/30 hover:bg-black/40"
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
                                      ? "text-rose-300"
                                      : "text-white/30",
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
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Instrument
                          </div>
                          <div className="mt-1 font-mono text-sm text-white/80">
                            {symbol}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Status
                          </div>
                          <div className="mt-1 text-sm text-white/70">
                            Public ClickHouse cache (MVP)
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Notes
                          </div>
                          <div className="mt-1 text-sm text-white/60">
                            This sidebar becomes accounts, order ticket, DOM,
                            alerts, etc.
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="trade"
                      className="flex-1 overflow-auto p-3"
                    >
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-xs font-semibold text-white/70">
                            Order ticket (MVP)
                          </div>
                          <div className="mt-3 grid gap-3">
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Size
                              </Label>
                              <Input
                                defaultValue="0.01"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Stop loss
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs text-white/60">
                                Take profit
                              </Label>
                              <Input
                                placeholder="Optional"
                                inputMode="decimal"
                                className="h-9"
                              />
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="grid grid-cols-2 gap-2">
                              <Button className="h-9 bg-emerald-600 hover:bg-emerald-700">
                                Buy
                              </Button>
                              <Button className="h-9 bg-rose-600 hover:bg-rose-700">
                                Sell
                              </Button>
                            </div>
                            <div className="text-xs text-white/50">
                              MVP only — no broker execution yet.
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={28} minSize={18}>
          <div className="h-full p-3">
            <div className="h-full overflow-hidden rounded-2xl border border-white/10 bg-white/3 backdrop-blur-md">
              <Tabs defaultValue="positions" className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <TabsList className="grid w-[420px] grid-cols-4">
                    <TabsTrigger value="positions">Positions</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="fills">Fills</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  </TabsList>
                  <div className="text-xs text-white/50">
                    {symbol} • demo data
                  </div>
                </div>

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
                        <TableCell className="text-right font-mono text-emerald-200">
                          +12.40
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="orders" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    No open orders (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="fills" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    Fill history will go here (MVP).
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="flex-1 overflow-auto p-4">
                  <div className="text-sm text-white/60">
                    Alerts & notifications will go here (MVP).
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

