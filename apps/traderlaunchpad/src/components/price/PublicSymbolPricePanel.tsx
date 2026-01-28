"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@acme/ui/button";
import React from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@acme/ui/skeleton";
import { TradingChartReal } from "~/components/charts/TradingChartReal";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui/lib/utils";
import { useAction } from "convex/react";
import type { SeriesMarker, Time, UTCTimestamp } from "lightweight-charts";

type Resolution = "15m" | "1H" | "4H" | "1D";

const normalizeTf = (value: string | null): Resolution | null => {
  const v = (value ?? "").trim();
  if (v === "15m") return "15m";
  if (v === "1H") return "1H";
  if (v === "4H") return "4H";
  if (v === "1D") return "1D";
  return null;
};

interface CacheEntry {
  bars: Bar[];
  nextToMs: number | null;
  sourceKey: string | null;
  fetchedAtMs: number;
}

interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface HeaderOHLC {
  kind: "crosshair" | "last";
  t: number; // ms
  o: number;
  h: number;
  l: number;
  c: number;
}

const parseBars = (value: unknown): Bar[] => {
  if (!Array.isArray(value)) return [];
  const result: Bar[] = [];
  for (const row of value) {
    const r = row as Partial<Bar>;
    if (
      typeof r.t === "number" &&
      typeof r.o === "number" &&
      typeof r.h === "number" &&
      typeof r.l === "number" &&
      typeof r.c === "number"
    ) {
      result.push({
        t: r.t,
        o: r.o,
        h: r.h,
        l: r.l,
        c: r.c,
        v: typeof r.v === "number" ? r.v : 0,
      });
    }
  }
  return result;
};

export function PublicSymbolPricePanel({
  symbol,
  selectedSourceKey,
  sourceOptions,
  onSelectedSourceKeyChangeAction,
  externalLoading,
  chartHeight,
  fillHeight,
  className,
}: {
  symbol: string;
  selectedSourceKey?: string | null;
  sourceOptions?: { sourceKey: string; label: string; isDefault?: boolean }[];
  onSelectedSourceKeyChangeAction?: (nextSourceKey: string) => void;
  externalLoading?: boolean;
  chartHeight?: number;
  fillHeight?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getBars = useAction(api.traderlaunchpad.actions.pricedataGetPublicBars);
  const ensure = useAction(api.traderlaunchpad.actions.pricedataEnsurePublicBarsCached);
  const getOverlays = useAction(api.traderlaunchpad.actions.pricedataGetMyChartOverlays);

  const urlTf = normalizeTf(searchParams.get("tf"));
  const [resolution, setResolution] = React.useState<Resolution>(urlTf ?? "15m");
  const pageSize = 2000;
  const cacheTtlMs = 60_000;
  const cacheRef = React.useRef<Record<string, CacheEntry | undefined>>({});

  const [loading, setLoading] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [resolvedSourceKey, setResolvedSourceKey] = React.useState<string | null>(null);
  const [bars, setBars] = React.useState<Bar[]>([]);
  const [nextToMs, setNextToMs] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showRaw, setShowRaw] = React.useState(false);

  const requestedSourceKey =
    typeof selectedSourceKey === "string" && selectedSourceKey.trim()
      ? selectedSourceKey.trim()
      : undefined;
  const cacheKey = `${requestedSourceKey ?? "default"}::${resolution}`;
  const isLoading = loading || Boolean(externalLoading);

  const indicatorStr = searchParams.get("ind");
  const enabledIndicators = new Set(
    indicatorStr === null || indicatorStr === "none"
      ? []
      : indicatorStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
  );
  const showVolume =
    indicatorStr === null ? true : enabledIndicators.size > 0 && enabledIndicators.has("vol");

  const handleToggleVolume = React.useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const curr = sp.get("ind");
    const next = curr === "none" ? "vol" : curr?.includes("vol") === true ? "none" : "vol";
    sp.set("ind", next);
    router.replace(`/symbol/${encodeURIComponent(symbol)}?${sp.toString()}`, { scroll: false });
  }, [router, searchParams, symbol]);

  React.useEffect(() => {
    const next = normalizeTf(searchParams.get("tf"));
    if (next && next !== resolution) setResolution(next);
  }, [resolution, searchParams]);

  React.useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    let changed = false;

    const tf = normalizeTf(sp.get("tf"));
    if (tf !== resolution) {
      sp.set("tf", resolution);
      changed = true;
    }
    if (sp.get("ind") == null) {
      sp.set("ind", "vol");
      changed = true;
    }

    if (!changed) return;
    router.replace(`/symbol/${encodeURIComponent(symbol)}?${sp.toString()}`, { scroll: false });
  }, [router, resolution, searchParams, symbol]);

  const load = React.useCallback(async () => {
    const cached = cacheRef.current[cacheKey];
    const nowMs = Date.now();
    if (
      cached &&
      cached.bars.length > 0 &&
      nowMs - cached.fetchedAtMs <= cacheTtlMs
    ) {
      setError(null);
      setResolvedSourceKey(cached.sourceKey);
      setBars(cached.bars);
      setNextToMs(cached.nextToMs);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: unknown = await getBars({
        symbol,
        resolution,
        sourceKey: requestedSourceKey,
        limit: pageSize,
      });
      const r = res as {
        ok?: boolean;
        sourceKey?: string;
        bars?: Bar[];
        nextToMs?: number;
        error?: string;
      };
      const nextResolvedSourceKey = typeof r.sourceKey === "string" ? r.sourceKey : null;
      const nextBars = parseBars(r.bars);
      const nextCursor = typeof r.nextToMs === "number" ? r.nextToMs : null;

      setResolvedSourceKey(nextResolvedSourceKey);
      setBars(nextBars);
      setNextToMs(nextCursor);

      // Cache only the latest-page fetch (no `toMs` cursor).
      if (r.ok !== false && nextBars.length > 0) {
        cacheRef.current[cacheKey] = {
          bars: nextBars,
          nextToMs: nextCursor,
          sourceKey: nextResolvedSourceKey,
          fetchedAtMs: Date.now(),
        };
      }
      if (r.ok === false) setError(r.error ?? "No cached data.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cacheTtlMs, getBars, requestedSourceKey, resolution, symbol]);

  const loadOlder = React.useCallback(async () => {
    if (typeof nextToMs !== "number") return;
    if (loadingOlder) return;
    setLoadingOlder(true);
    setError(null);
    try {
      const res: unknown = await getBars({
        symbol,
        resolution,
        sourceKey: requestedSourceKey,
        limit: pageSize,
        toMs: nextToMs,
      });
      const r = res as {
        ok?: boolean;
        bars?: Bar[];
        nextToMs?: number;
        error?: string;
      };
      if (r.ok === false) {
        setError(r.error ?? "Failed to load older candles.");
        return;
      }
      const older = parseBars(r.bars);
      // Prepend and let the server-side dedupe handle duplicates across pages.
      setBars((prev) => [...older, ...prev]);
      setNextToMs(typeof r.nextToMs === "number" ? r.nextToMs : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingOlder(false);
    }
  }, [getBars, loadingOlder, nextToMs, requestedSourceKey, resolution, symbol]);

  const ensureAndReload = React.useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      // Ensure we refetch after Sync.
      cacheRef.current[cacheKey] = undefined;

      // Warm a small recent window; deeper history should be handled by platform backfill jobs.
      const res: unknown = await ensure({
        symbol,
        resolution,
        sourceKey: requestedSourceKey,
        lookbackDays: 7,
      });
      const r = res as { ok?: boolean; error?: string };
      if (r.ok === false) {
        setError(r.error ?? "Failed to fetch from broker.");
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  }, [cacheKey, ensure, load, requestedSourceKey, resolution, symbol]);

  React.useEffect(() => {
    // Reset cache & state when symbol changes.
    cacheRef.current = {};
    setBars([]);
    setNextToMs(null);
    setResolvedSourceKey(null);
    setError(null);
  }, [symbol, requestedSourceKey]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // If there are no cached bars but we have a default source configured, auto-warm once.
  const didAutoWarmRef = React.useRef(false);
  React.useEffect(() => {
    didAutoWarmRef.current = false;
  }, [symbol, resolution, requestedSourceKey]);
  React.useEffect(() => {
    if (didAutoWarmRef.current) return;
    if (bars.length > 0) return;
    if (!error) return;
    if (!resolvedSourceKey) return;
    if (error.includes("No default price source")) return;
    didAutoWarmRef.current = true;
    void ensureAndReload();
  }, [bars.length, ensureAndReload, error, resolvedSourceKey]);

  const last = bars.length > 0 ? bars[bars.length - 1] : null;
  const lastTime = last ? new Date(last.t).toISOString() : null;
  const first = bars.length > 0 ? bars[0] : null;
  const change = first && last ? last.c - first.o : null;
  const changePct =
    first && last && first.o !== 0 ? ((last.c - first.o) / first.o) * 100 : null;

  const [hoverOHLC, setHoverOHLC] = React.useState<HeaderOHLC | null>(null);
  const indexByTimeMs = React.useMemo(() => {
    const m = new Map<number, number>();
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      if (!b) continue;
      m.set(b.t, i);
    }
    return m;
  }, [bars]);

  React.useEffect(() => {
    if (!last) return;
    // Ensure we always have a "last bar" header, even before the first crosshair move.
    setHoverOHLC(
      (prev) => prev ?? { kind: "last", t: last.t, o: last.o, h: last.h, l: last.l, c: last.c },
    );
  }, [last]);

  const headerOHLC = hoverOHLC;
  const headerPrevClose = React.useMemo(() => {
    if (!headerOHLC) return null;
    const idx = indexByTimeMs.get(headerOHLC.t);
    if (typeof idx !== "number") return null;
    const prev = idx > 0 ? bars[idx - 1] : null;
    return prev ? prev.c : null;
  }, [bars, headerOHLC, indexByTimeMs]);
  const headerChange = headerOHLC && headerPrevClose ? headerOHLC.c - headerPrevClose : null;
  const headerChangePct =
    headerOHLC && headerPrevClose && headerPrevClose !== 0
      ? ((headerOHLC.c - headerPrevClose) / headerPrevClose) * 100
      : null;

  const handleCrosshairOHLCChange = React.useCallback((value: unknown) => {
    const v = value as Partial<HeaderOHLC> | null | undefined;
    if (!v) return;
    if (v.kind !== "crosshair" && v.kind !== "last") return;
    if (
      typeof v.t !== "number" ||
      typeof v.o !== "number" ||
      typeof v.h !== "number" ||
      typeof v.l !== "number" ||
      typeof v.c !== "number"
    ) {
      return;
    }
    setHoverOHLC({ kind: v.kind, t: v.t, o: v.o, h: v.h, l: v.l, c: v.c });
  }, []);

  const mockMarkers = React.useMemo(() => {
    if (bars.length < 60) return [] as SeriesMarker<Time>[];
    const entry = bars[Math.floor(bars.length * 0.7)];
    const exit = bars[Math.floor(bars.length * 0.9)];
    if (!entry || !exit) return [] as SeriesMarker<Time>[];
    return [
      {
        time: (Math.floor(entry.t / 1000) as UTCTimestamp) satisfies UTCTimestamp,
        position: "belowBar",
        color: "#10B981",
        shape: "arrowUp",
        text: "Entry",
      },
      {
        time: (Math.floor(exit.t / 1000) as UTCTimestamp) satisfies UTCTimestamp,
        position: "aboveBar",
        color: "#EF4444",
        shape: "arrowDown",
        text: "Exit",
      },
    ] satisfies SeriesMarker<Time>[];
  }, [bars]);

  const mockPriceLines = React.useMemo(() => {
    if (!last) return [];
    const sl = last.c * 0.985;
    const tp = last.c * 1.015;
    return [
      { price: sl, color: "rgba(239,68,68,0.85)", lineWidth: 1, title: "SL" },
      { price: tp, color: "rgba(16,185,129,0.85)", lineWidth: 1, title: "TP" },
    ];
  }, [last]);

  const [overlays, setOverlays] = React.useState<{
    hasIdentity: boolean;
    markers: { t: number; kind: string; side?: string; label?: string }[];
    priceLines: { price: number; kind: string; title?: string }[];
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setOverlays(null);
    getOverlays({ symbol, sourceKey: requestedSourceKey })
      .then((resUnknown: unknown) => {
        if (cancelled) return;
        const r = (resUnknown ?? {}) as Record<string, unknown>;
        const hasIdentity = r.hasIdentity === true;
        const markersRaw = Array.isArray(r.markers) ? r.markers : [];
        const priceLinesRaw = Array.isArray(r.priceLines) ? r.priceLines : [];
        const markers: { t: number; kind: string; side?: string; label?: string }[] = [];
        for (const m of markersRaw) {
          const obj = m as Record<string, unknown>;
          const t = typeof obj.t === "number" ? obj.t : NaN;
          const kind = typeof obj.kind === "string" ? obj.kind : "";
          const side = typeof obj.side === "string" ? obj.side : undefined;
          const label = typeof obj.label === "string" ? obj.label : undefined;
          if (Number.isFinite(t) && kind) markers.push({ t, kind, side, label });
        }

        const priceLines: { price: number; kind: string; title?: string }[] = [];
        for (const p of priceLinesRaw) {
          const obj = p as Record<string, unknown>;
          const price = typeof obj.price === "number" ? obj.price : NaN;
          const kind = typeof obj.kind === "string" ? obj.kind : "";
          const title = typeof obj.title === "string" ? obj.title : undefined;
          if (Number.isFinite(price) && kind) priceLines.push({ price, kind, title });
        }

        setOverlays({ hasIdentity, markers, priceLines });
      })
      .catch(() => {
        if (cancelled) return;
        setOverlays(null);
      });
    return () => {
      cancelled = true;
    };
  }, [getOverlays, requestedSourceKey, symbol]);

  const chartMarkers = React.useMemo(() => {
    if (overlays?.hasIdentity === true) {
      return overlays.markers.map((m) => ({
        time: (Math.floor(m.t / 1000) as UTCTimestamp) satisfies UTCTimestamp,
        position: m.kind === "entry" ? "belowBar" : "aboveBar",
        color: m.kind === "entry" ? "#10B981" : "#EF4444",
        shape: m.kind === "entry" ? "arrowUp" : "arrowDown",
        text: m.label ?? (m.kind === "entry" ? "Entry" : "Exit"),
      })) satisfies SeriesMarker<Time>[];
    }
    return mockMarkers;
  }, [mockMarkers, overlays]);

  const chartPriceLines = React.useMemo(() => {
    if (overlays?.hasIdentity === true) {
      return overlays.priceLines.map((p) => ({
        price: p.price,
        color:
          p.kind === "tp"
            ? "rgba(16,185,129,0.85)"
            : p.kind === "sl"
              ? "rgba(239,68,68,0.85)"
              : "rgba(148,163,184,0.85)",
        lineWidth: 1,
        title: p.title ?? p.kind.toUpperCase(),
      }));
    }
    return mockPriceLines;
  }, [mockPriceLines, overlays]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-border/40 bg-card/70 text-foreground backdrop-blur-md",
        className,
      )}
    >
      <div className="px-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Real price data (cached)
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {resolvedSourceKey ? (
                <>
                  Source:{" "}
                  <span className="font-mono text-foreground/80">{resolvedSourceKey}</span>
                </>
              ) : (
                "Source not configured yet."
              )}
            </div>
            {headerOHLC ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="font-mono text-foreground/80">
                  O {headerOHLC.o.toFixed(3)} H {headerOHLC.h.toFixed(3)} L{" "}
                  {headerOHLC.l.toFixed(3)} C {headerOHLC.c.toFixed(3)}
                </span>
                {headerChange !== null && headerChangePct !== null ? (
                  <span
                    className={
                      headerChange >= 0
                        ? "font-mono text-emerald-500"
                        : "font-mono text-rose-500"
                    }
                  >
                    {headerChange >= 0 ? "+" : "-"}
                    {Math.abs(headerChange).toFixed(3)} ({headerChangePct >= 0 ? "+" : "-"}
                    {Math.abs(headerChangePct).toFixed(2)}%)
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
          {bars.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9"
              onClick={() => setShowRaw((v) => !v)}
              disabled={loading || syncing}
            >
              {showRaw ? "Hide raw" : "Show raw"}
            </Button>
          ) : null}
          {Array.isArray(sourceOptions) && sourceOptions.length > 0 ? (
            <Select
              value={requestedSourceKey ?? ""}
              onValueChange={(v) => onSelectedSourceKeyChangeAction?.(v)}
            >
              <SelectTrigger size="sm" className="h-9 min-w-[180px]">
                <SelectValue placeholder="Select feed" />
              </SelectTrigger>
              <SelectContent align="start">
                {sourceOptions.map((s) => (
                  <SelectItem key={s.sourceKey} value={s.sourceKey}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Button
            type="button"
            variant={resolution === "15m" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setResolution("15m")}
            disabled={loading || syncing}
          >
            15m
          </Button>
          <Button
            type="button"
            variant={resolution === "1H" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setResolution("1H")}
            disabled={loading || syncing}
          >
            1H
          </Button>
          <Button
            type="button"
            variant={resolution === "4H" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setResolution("4H")}
            disabled={loading || syncing}
          >
            4H
          </Button>
          <Button
            type="button"
            variant={resolution === "1D" ? "secondary" : "outline"}
            className="h-9"
            onClick={() => setResolution("1D")}
            disabled={loading || syncing}
          >
            1D
          </Button>

          <Button
            type="button"
            variant={showVolume ? "secondary" : "outline"}
            className="h-9"
            onClick={handleToggleVolume}
            disabled={loading || syncing}
          >
            Vol
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={ensureAndReload}
            disabled={loading || syncing || !resolvedSourceKey}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncing ? "Syncing..." : "Sync"}
          </Button>


          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/40 bg-background/40 px-2 py-1">
            Symbol: <span className="font-mono text-foreground/80">{symbol}</span>
          </span>
          <span className="rounded-full border border-border/40 bg-background/40 px-2 py-1">
            Bars: <span className="font-mono text-foreground/80">{bars.length}</span>
          </span>
          {lastTime ? (
            <span className="rounded-full border border-border/40 bg-background/40 px-2 py-1">
              Last ts: <span className="font-mono text-foreground/80">{lastTime}</span>
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mx-6 mt-4 rounded-xl border border-border/40 bg-background/60 p-3 text-sm text-foreground/80">
          {error}
        </div>
      ) : null}

      <div
        className={cn(
          "relative mt-4 overflow-hidden border-t border-border/40 bg-background/40",
          fillHeight ? "flex min-h-0 flex-1 flex-col" : undefined,
        )}
      >
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex flex-col gap-3 bg-background/70 p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-full w-full" />
          </div>
        ) : null}

        {!isLoading && bars.length === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border border-border/40 bg-background/85 p-4 text-center backdrop-blur">
              <div className="text-sm font-semibold text-foreground">
                No data available
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                No data available for this instrument/broker combination.
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                {symbol}
                {resolvedSourceKey ? ` • ${resolvedSourceKey}` : ""}
              </div>
            </div>
          </div>
        ) : null}

        <TradingChartReal
          bars={bars}
          {...(typeof chartHeight === "number" && !fillHeight
            ? { height: chartHeight }
            : fillHeight
              ? {}
              : { height: 360 })}
          className={cn("w-full", fillHeight ? "h-full flex-1" : undefined)}
          datasetKey={`${symbol}::${requestedSourceKey ?? "default"}::${resolution}`}
          showVolume={showVolume}
          markers={chartMarkers}
          priceLines={chartPriceLines}
          hasMoreHistory={typeof nextToMs === "number"}
          isRequestingMoreHistory={loadingOlder}
          onRequestMoreHistory={() => void loadOlder()}
          onCrosshairOHLCChange={handleCrosshairOHLCChange}
        />

        {bars.length > 0 ? (
          <div className="flex items-center justify-between gap-2 border-t border-border/40 bg-background/50 p-3 text-xs text-muted-foreground">
            <div>
              {typeof nextToMs === "number" ? (
                <>
                  Older candles available.{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => void loadOlder()}
                    disabled={loading || loadingOlder || syncing}
                  >
                    {loadingOlder ? "Loading..." : "Load older"}
                  </button>
                </>
              ) : (
                "No older candles."
              )}
            </div>
            <div className="font-mono text-foreground/80">{bars.length} bars</div>
          </div>
        ) : null}

        {showRaw ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-border/40 bg-background/50 p-3 text-[11px] text-muted-foreground">
            {JSON.stringify(bars.slice(Math.max(0, bars.length - 100)), null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

