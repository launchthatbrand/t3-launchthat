"use client";

import React from "react";
import Link from "next/link";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@acme/ui/button";

export function PublicSymbolsGrid() {
  const list = useAction(api.traderlaunchpad.actions.pricedataListPublicSymbols);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sourceKey, setSourceKey] = React.useState<string | null>(null);
  const [symbols, setSymbols] = React.useState<string[]>([]);

  const handleLoad = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: unknown = await list({ limit: 1500 });
      const r = res as { sourceKey?: string; symbols?: string[] };
      setSourceKey(typeof r.sourceKey === "string" ? r.sourceKey : null);
      setSymbols(Array.isArray(r.symbols) ? r.symbols : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [list]);

  React.useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  if (error) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6 text-white/70 backdrop-blur-md">
        Failed to load symbols: {error}
      </div>
    );
  }

  if (!sourceKey) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6 text-white/70 backdrop-blur-md">
        <div className="text-sm font-semibold text-white/80">No default price source</div>
        <div className="mt-2 text-sm text-white/60">
          Set the default source in <span className="font-mono">/admin/settings/connections</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/50">
          Source: <span className="font-mono text-white/70">{sourceKey}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleLoad}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {symbols.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/3 p-6 text-white/70 backdrop-blur-md">
          No instruments cached for this source yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {symbols.map((symbol) => (
            <Link
              key={symbol}
              href={`/s/${encodeURIComponent(symbol)}`}
              className="group rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors hover:bg-white/6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-white/90">{symbol}</div>
                  <div className="mt-2 text-sm text-white/55">View cached bars</div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

