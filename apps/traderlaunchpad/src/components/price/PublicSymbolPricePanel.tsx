"use client";

import { Button } from "@acme/ui/button";
import React from "react";
import { RefreshCw } from "lucide-react";
import { TradingChartReal } from "~/components/charts/TradingChartReal";
import { api } from "@convex-config/_generated/api";
import { useAction } from "convex/react";

type Resolution = "15m" | "1H" | "4H";

interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const parseBars = (value: unknown): Bar[] => {
  if (!Array.isArray(value)) return [];
  const result: Bar[] = [];
  for (const row of value) {
    const r = row as Partial<Bar>;
    if (
      typeof r?.t === "number" &&
      typeof r?.o === "number" &&
      typeof r?.h === "number" &&
      typeof r?.l === "number" &&
      typeof r?.c === "number"
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

export function PublicSymbolPricePanel({ symbol }: { symbol: string }) {
  const getBars = useAction(api.traderlaunchpad.actions.pricedataGetPublicBars);
  const ensure = useAction(api.traderlaunchpad.actions.pricedataEnsurePublicBarsCached);

  const [resolution, setResolution] = React.useState<Resolution>("15m");
  // 0 = "all available" (server will cap to a safe maximum number of bars)
  const [lookbackDays, setLookbackDays] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [sourceKey, setSourceKey] = React.useState<string | null>(null);
  const [bars, setBars] = React.useState<Bar[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showRaw, setShowRaw] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: unknown = await getBars({ symbol, resolution, lookbackDays });
      const r = res as {
        ok?: boolean;
        sourceKey?: string;
        bars?: Bar[];
        error?: string;
      };
      setSourceKey(typeof r.sourceKey === "string" ? r.sourceKey : null);
      setBars(parseBars(r.bars));
      if (r.ok === false) setError(r.error ?? "No cached data.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [getBars, lookbackDays, resolution, symbol]);

  const ensureAndReload = React.useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res: unknown = await ensure({ symbol, resolution, lookbackDays });
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
  }, [ensure, load, lookbackDays, resolution, symbol]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // If there are no cached bars but we have a default source configured, auto-warm once.
  const didAutoWarmRef = React.useRef(false);
  React.useEffect(() => {
    if (didAutoWarmRef.current) return;
    if (bars.length > 0) return;
    if (!error) return;
    if (!sourceKey) return;
    if (error.includes("No default price source")) return;
    didAutoWarmRef.current = true;
    void ensureAndReload();
  }, [bars.length, ensureAndReload, error, sourceKey]);

  const last = bars.length > 0 ? bars[bars.length - 1] : null;
  const lastTime = last ? new Date(last.t).toISOString() : null;
  const first = bars.length > 0 ? bars[0] : null;
  const change = first && last ? last.c - first.o : null;
  const changePct =
    first && last && first.o !== 0 ? ((last.c - first.o) / first.o) * 100 : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/85">
            Real price data (cached)
          </div>
          <div className="mt-1 text-xs text-white/55">
            {sourceKey ? (
              <>
                Source: <span className="font-mono text-white/70">{sourceKey}</span>
              </>
            ) : (
              "Source not configured yet."
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            variant="outline"
            className="h-9"
            onClick={ensureAndReload}
            disabled={loading || syncing || !sourceKey}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {syncing ? "Syncing..." : "Sync"}
          </Button>

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
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/55">
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
          Symbol: <span className="font-mono text-white/75">{symbol}</span>
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
          Bars: <span className="font-mono text-white/75">{bars.length}</span>
        </span>
        {lastTime ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Last: <span className="font-mono text-white/75">{lastTime}</span>
          </span>
        ) : null}
        {last ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Close:{" "}
            <span className="font-mono text-white/75">{last.c.toFixed(3)}</span>
          </span>
        ) : null}
        {change !== null && changePct !== null ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Δ{" "}
            <span className={change >= 0 ? "font-mono text-emerald-200" : "font-mono text-rose-200"}>
              {change >= 0 ? "+" : "-"}
              {Math.abs(change).toFixed(3)} ({changePct >= 0 ? "+" : "-"}
              {Math.abs(changePct).toFixed(2)}%)
            </span>
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/70">
          {error}
        </div>
      ) : null}

      {bars.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <TradingChartReal bars={bars} height={360} className="w-full" />

          {showRaw ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
              {JSON.stringify(bars.slice(Math.max(0, bars.length - 100)), null, 2)}
            </pre>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 text-sm text-white/60">
          No cached bars yet. Click <span className="font-semibold text-white/80">Sync</span> to fetch and store them.
        </div>
      )}
    </div>
  );
}

