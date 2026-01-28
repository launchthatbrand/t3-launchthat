"use client";

import * as React from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { TradingChartReal, type RealBar } from "~/components/charts/TradingChartReal";
import { usePlatformPriceDataStore } from "~/stores/platformPriceDataStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type JobStatus = "queued" | "running" | "done" | "error";

const jobBadgeVariant = (s: JobStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "done") return "secondary";
  if (s === "error") return "destructive";
  if (s === "running") return "default";
  return "outline";
};

const pillButtonClass =
  "inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-white/70 px-3 py-2 text-sm text-foreground/90 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10";

export const PlatformDataClient = () => {
  const listConfiguredSources = useAction(api.platform.tradelockerSources.listConfiguredSources);
  const listInstrumentsForSourceKey = useAction(
    api.platform.tradelockerSources.listInstrumentsForSourceKey,
  );
  const getCoverageSummary1m = useAction(api.platform.clickhouseData.getCoverageSummary1m);
  const compareBrokersForSymbol1m = useAction(api.platform.clickhouseData.compareBrokersForSymbol1m);
  const listCandles1m = useAction(api.platform.clickhouseCandles.listCandles1m);

  const startJob = useMutation(api.platform.priceDataJobs.startBackfillJob1m);

  const tab = usePlatformPriceDataStore((s) => s.tab);
  const setTab = usePlatformPriceDataStore((s) => s.setTab);

  const sourceKey = usePlatformPriceDataStore((s) => s.sourceKey);
  const setSourceKey = usePlatformPriceDataStore((s) => s.setSourceKey);

  const pairSearch = usePlatformPriceDataStore((s) => s.pairSearch);
  const setPairSearch = usePlatformPriceDataStore((s) => s.setPairSearch);

  const tradableInstrumentId = usePlatformPriceDataStore((s) => s.tradableInstrumentId);
  const symbol = usePlatformPriceDataStore((s) => s.symbol);
  const setInstrument = usePlatformPriceDataStore((s) => s.setInstrument);

  const [compareSymbol, setCompareSymbol] = React.useState<string>("");

  const lookback = usePlatformPriceDataStore((s) => s.lookback);
  const setLookback = usePlatformPriceDataStore((s) => s.setLookback);
  const overlapDays = usePlatformPriceDataStore((s) => s.overlapDays);
  const setOverlapDays = usePlatformPriceDataStore((s) => s.setOverlapDays);

  const chartLookback = usePlatformPriceDataStore((s) => s.chartLookback);
  const setChartLookback = usePlatformPriceDataStore((s) => s.setChartLookback);
  const [bars, setBars] = React.useState<RealBar[]>([]);
  const [loadingBars, setLoadingBars] = React.useState(false);
  const [barsError, setBarsError] = React.useState<string | null>(null);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [brokers, setBrokers] = React.useState<
    Array<{
      connectionId: string;
      label: string;
      sourceKey: string;
      environment: "demo" | "live";
      server: string;
      jwtHost?: string;
    }> | null
  >(null);
  const [pairs, setPairs] = React.useState<
    Array<{ tradableInstrumentId: string; symbol: string; infoRouteId?: number }> | null
  >(null);

  const filteredPairs = React.useMemo(() => {
    const q = pairSearch.trim().toLowerCase();
    if (!q) return pairs ?? [];
    return (pairs ?? []).filter((p) => p.symbol.toLowerCase().includes(q));
  }, [pairSearch, pairs]);

  const [coverage, setCoverage] = React.useState<{
    minTs?: string;
    maxTs?: string;
    rows: number;
    expectedRows: number;
    missingEstimate: number;
  } | null>(null);
  const [compare, setCompare] = React.useState<
    Array<{
      sourceKey: string;
      tradableInstrumentId: string;
      minTs?: string;
      maxTs?: string;
      rows_24h: number;
    }>
  >([]);

  const [loadingBrokers, setLoadingBrokers] = React.useState(false);
  const [loadingPairs, setLoadingPairs] = React.useState(false);
  const [loadingCoverage, setLoadingCoverage] = React.useState(false);
  const [loadingCompare, setLoadingCompare] = React.useState(false);

  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);

  const jobs = useQuery(
    api.platform.priceDataJobs.listJobs,
    sourceKey && tradableInstrumentId
      ? { limit: 25, sourceKey, tradableInstrumentId }
      : { limit: 25 },
  );

  const activeJob = React.useMemo(() => {
    if (!activeJobId) return null;
    return (jobs ?? []).find((j) => String(j._id) === activeJobId) ?? null;
  }, [activeJobId, jobs]);

  React.useEffect(() => {
    setError(null);
    setBarsError(null);
  }, [sourceKey, tradableInstrumentId, symbol, compareSymbol]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingBrokers(true);
    listConfiguredSources({})
      .then((rows) => {
        if (cancelled) return;
        setBrokers(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load brokers");
        setBrokers([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingBrokers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listConfiguredSources]);

  React.useEffect(() => {
    let cancelled = false;
    setPairs(null);
    setCoverage(null);
    if (!sourceKey) return;

    setLoadingPairs(true);
    const q = pairSearch.trim() || undefined;
    const t = setTimeout(() => {
      listInstrumentsForSourceKey({ sourceKey, search: q, limit: 400 })
        .then((rows) => {
          if (cancelled) return;
          setPairs(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to load pairs");
          setPairs([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingPairs(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [listInstrumentsForSourceKey, pairSearch, sourceKey]);

  React.useEffect(() => {
    let cancelled = false;
    setCoverage(null);
    if (!sourceKey || !tradableInstrumentId) return;

    setLoadingCoverage(true);
    getCoverageSummary1m({ sourceKey, tradableInstrumentId })
      .then((row) => {
        if (cancelled) return;
        setCoverage(row);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load coverage");
        setCoverage(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCoverage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getCoverageSummary1m, sourceKey, tradableInstrumentId]);

  React.useEffect(() => {
    let cancelled = false;
    const sym = compareSymbol.trim().toUpperCase();
    if (!sym) {
      setCompare([]);
      return;
    }

    setLoadingCompare(true);
    const t = setTimeout(() => {
      compareBrokersForSymbol1m({ symbol: sym, limit: 200 })
        .then((rows) => {
          if (cancelled) return;
          setCompare(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to compare brokers");
          setCompare([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingCompare(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [compareBrokersForSymbol1m, compareSymbol]);

  const fetchChart = React.useCallback(() => {
    if (!sourceKey || !tradableInstrumentId) return;
    const toMs = Date.now();
    const fromMs = toMs - chartLookback * 24 * 60 * 60 * 1000;
    setLoadingBars(true);
    setBarsError(null);
    listCandles1m({
      sourceKey,
      tradableInstrumentId,
      fromMs,
      toMs,
      limit: 5000,
    })
      .then((rows) => setBars(rows))
      .catch((e) => {
        setBars([]);
        setBarsError(e instanceof Error ? e.message : "Failed to load candles");
      })
      .finally(() => setLoadingBars(false));
  }, [chartLookback, listCandles1m, sourceKey, tradableInstrumentId]);

  React.useEffect(() => {
    if (tab !== "chart") return;
    if (!sourceKey || !tradableInstrumentId) {
      setBars([]);
      return;
    }

    let cancelled = false;
    setLoadingBars(true);
    setBarsError(null);
    const t = setTimeout(() => {
      const toMs = Date.now();
      const fromMs = toMs - chartLookback * 24 * 60 * 60 * 1000;
      listCandles1m({
        sourceKey,
        tradableInstrumentId,
        fromMs,
        toMs,
        limit: 5000,
      })
        .then((rows) => {
          if (cancelled) return;
          setBars(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setBars([]);
          setBarsError(e instanceof Error ? e.message : "Failed to load candles");
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingBars(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [chartLookback, listCandles1m, sourceKey, tab, tradableInstrumentId]);

  const handlePickPair = (value: string) => {
    const [id, sym] = value.split("|");
    setInstrument({ tradableInstrumentId: id ?? "", symbol: sym ?? "" });
  };

  const handleStartJob = async () => {
    setError(null);
    if (!sourceKey.trim()) return setError("Pick a broker/sourceKey first.");
    if (!tradableInstrumentId.trim()) return setError("Pick a pair first.");
    if (!symbol.trim()) return setError("Missing symbol for the selected pair.");

    const overlap = Number(overlapDays);
    if (!Number.isFinite(overlap) || overlap < 0 || overlap > 7) {
      return setError("Overlap days must be a number between 0 and 7.");
    }

    setBusy(true);
    try {
      await startJob({
        sourceKey,
        tradableInstrumentId,
        symbol,
        requestedLookbackDays: lookback,
        overlapDays: overlap,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="jobs">Sync</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={pillButtonClass} aria-label="Select broker">
                <span className="text-muted-foreground">Broker</span>
                <span className="max-w-[320px] truncate font-medium">
                  {sourceKey ? sourceKey : "Select…"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[420px]">
              <DropdownMenuLabel>Broker</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingBrokers ? (
                <div className="text-muted-foreground px-2 py-2 text-sm">Loading…</div>
              ) : (brokers ?? []).length === 0 ? (
                <div className="text-muted-foreground px-2 py-2 text-sm">No brokers found.</div>
              ) : (
                <div className="max-h-[340px] overflow-auto">
                  {(brokers ?? []).map((b) => (
                    <DropdownMenuItem key={b.sourceKey} onClick={() => setSourceKey(b.sourceKey)}>
                      <span className="truncate">
                        {b.label ? `${b.label} — ` : ""}
                        <span className="font-mono text-xs">{b.sourceKey}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={pillButtonClass}
                aria-label="Select instrument"
                disabled={!sourceKey}
              >
                <span className="text-muted-foreground">Instrument</span>
                <span className="max-w-[260px] truncate font-medium">
                  {tradableInstrumentId && symbol
                    ? `${tradableInstrumentId} · ${symbol}`
                    : sourceKey
                      ? "Select…"
                      : "Select broker first"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[420px]">
              <DropdownMenuLabel>Instrument</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Input
                  placeholder="Filter… (e.g. BTC)"
                  value={pairSearch}
                  onChange={(e) => setPairSearch(e.target.value)}
                  disabled={!sourceKey}
                />
              </div>
              {loadingPairs ? (
                <div className="text-muted-foreground px-2 py-2 text-sm">Loading…</div>
              ) : !sourceKey ? (
                <div className="text-muted-foreground px-2 py-2 text-sm">Select a broker first.</div>
              ) : (pairs ?? []).length === 0 ? (
                <div className="text-muted-foreground px-2 py-2 text-sm">No instruments found.</div>
              ) : (
                <div className="max-h-[340px] overflow-auto">
                  {(filteredPairs ?? []).map((p) => {
                    const value = `${p.tradableInstrumentId}|${p.symbol}`;
                    return (
                      <DropdownMenuItem key={value} onClick={() => handlePickPair(value)}>
                        <span className="font-mono text-xs">{p.tradableInstrumentId}</span>
                        <span className="px-2 text-muted-foreground">·</span>
                        <span className="font-medium">{p.symbol}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={pillButtonClass} aria-label="Sync settings">
                <span className="text-muted-foreground">Sync</span>
                <span className="font-medium">{lookback}d</span>
                <span className="text-muted-foreground">overlap</span>
                <span className="font-medium">{overlapDays}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px]">
              <DropdownMenuLabel>Sync settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid gap-3 p-2">
                <div className="grid gap-2">
                  <Label>Lookback</Label>
                  <Select
                    value={String(lookback)}
                    onValueChange={(v) => setLookback(Number(v) as 1 | 3 | 7 | 14 | 30 | 60 | 90)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Overlap days</Label>
                  <Input value={overlapDays} onChange={(e) => setOverlapDays(e.target.value)} />
                </div>
                <div className="text-muted-foreground text-xs">
                  Used by the backfill runner (incremental with overlap).
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TabsContent value="chart" className="mt-0 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Trading chart</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={String(chartLookback)}
                  onValueChange={(v) => setChartLookback(Number(v) as 1 | 3 | 7 | 14)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchChart}
                  disabled={!sourceKey || !tradableInstrumentId || loadingBars}
                >
                  {loadingBars ? "Loading…" : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!sourceKey || !tradableInstrumentId ? (
                <div className="text-muted-foreground text-sm">
                  Select a broker + instrument to render the chart.
                </div>
              ) : barsError ? (
                <div className="text-sm text-red-600">{barsError}</div>
              ) : bars.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  {loadingBars ? "Loading candles…" : "No candles found for the selected range."}
                </div>
              ) : (
                <TradingChartReal bars={bars} className="w-full" height={420} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coverage summary (1m)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!coverage ? (
                <div className="text-muted-foreground text-sm">
                  {loadingCoverage ? "Loading…" : "Select a broker + instrument to see coverage."}
                </div>
              ) : (
                <div className="grid gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">rows: {coverage.rows.toLocaleString()}</Badge>
                    <Badge variant="outline">expected: {coverage.expectedRows.toLocaleString()}</Badge>
                    <Badge variant="outline">
                      missing est: {coverage.missingEstimate.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">min:</span>{" "}
                      {coverage.minTs ?? "—"}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">max:</span>{" "}
                      {coverage.maxTs ?? "—"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="compare" className="mt-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compare brokers by symbol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Symbol</Label>
              <Input
                placeholder="BTCUSD"
                value={compareSymbol}
                onChange={(e) => setCompareSymbol(e.target.value)}
              />
            </div>

            {compareSymbol.trim() && (compare ?? []).length === 0 ? (
              <div className="text-muted-foreground text-sm">No results.</div>
            ) : null}

            {(compare ?? []).length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>sourceKey</TableHead>
                      <TableHead>tradableInstrumentId</TableHead>
                      <TableHead>min</TableHead>
                      <TableHead>max</TableHead>
                      <TableHead className="text-right">rows (24h)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(compare ?? []).map((r) => (
                      <TableRow key={r.sourceKey}>
                        <TableCell className="font-mono text-xs">{r.sourceKey}</TableCell>
                        <TableCell className="font-mono text-xs">{r.tradableInstrumentId}</TableCell>
                        <TableCell className="text-xs">{r.minTs ?? "—"}</TableCell>
                        <TableCell className="text-xs">{r.maxTs ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {r.rows_24h.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                {loadingCompare ? "Loading…" : "Enter a symbol to compare coverage across brokers."}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="jobs" className="mt-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Backfill runner (1m)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="flex items-center gap-2">
              <Button onClick={handleStartJob} disabled={busy}>
                {busy ? "Starting…" : "Start backfill"}
              </Button>
              <div className="text-muted-foreground text-sm">
                Runs are incremental: longer lookbacks fetch only missing older slices (with overlap).
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Recent jobs</div>
              {(jobs ?? []).length === 0 ? (
                <div className="text-muted-foreground text-sm">No jobs yet.</div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Pair</TableHead>
                        <TableHead className="text-right">Lookback</TableHead>
                        <TableHead className="text-right">Overlap</TableHead>
                        <TableHead className="text-right">Inserted</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(jobs ?? []).map((j) => {
                        const inserted =
                          typeof (j.progress as any)?.insertedRowsDelta === "number"
                            ? (j.progress as any).insertedRowsDelta
                            : undefined;
                        const err =
                          typeof (j as any).error === "string" ? ((j as any).error as string) : "";
                        const errPreview =
                          err.length > 0 ? (err.length > 80 ? `${err.slice(0, 80)}…` : err) : "";
                        return (
                          <TableRow key={j._id}>
                            <TableCell className="w-[1%]">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveJobId(String(j._id))}
                              >
                                View
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Badge variant={jobBadgeVariant(j.status as JobStatus)}>{j.status}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{j.sourceKey}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {j.tradableInstrumentId} · {j.symbol}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {j.requestedLookbackDays}d
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{j.overlapDays}d</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {inserted !== undefined ? inserted.toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                              {errPreview || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <Dialog open={Boolean(activeJobId)} onOpenChange={(open) => (open ? null : setActiveJobId(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job details</DialogTitle>
          </DialogHeader>
          {!activeJob ? (
            <div className="text-muted-foreground text-sm">Job not found.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={jobBadgeVariant(activeJob.status as JobStatus)}>{activeJob.status}</Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {String(activeJob._id)}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeJob.sourceKey}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeJob.tradableInstrumentId}
                </Badge>
                <Badge variant="secondary">{activeJob.symbol}</Badge>
              </div>

              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-medium">Computed window:</span>{" "}
                  <span className="font-mono text-xs">
                    {(activeJob as any).computedFromTs ?? "—"} → {(activeJob as any).computedToTs ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Workflow:</span>{" "}
                  <span className="font-mono text-xs">{(activeJob as any).workflowId ?? "—"}</span>
                </div>
              </div>

              {(activeJob as any).error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                  <div className="text-sm font-medium text-red-700 dark:text-red-200">Error</div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-red-700/90 dark:text-red-200/90">
                    {String((activeJob as any).error)}
                  </pre>
                </div>
              ) : null}

              <div>
                <div className="text-sm font-medium">Progress</div>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {JSON.stringify((activeJob as any).progress ?? null, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

