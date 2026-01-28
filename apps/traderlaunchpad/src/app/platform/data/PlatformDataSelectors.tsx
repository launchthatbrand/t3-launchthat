"use client";

import * as React from "react";
import { useAction } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Input } from "@acme/ui/input";

import { usePlatformPriceDataStore } from "~/stores/platformPriceDataStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const pillButtonClass =
  "inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-white/70 px-3 py-2 text-sm text-foreground/90 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10";

export const PlatformDataSelectors = () => {
  const listConfiguredSources = useAction(api.platform.tradelockerSources.listConfiguredSources);
  const listInstrumentsForSourceKey = useAction(
    api.platform.tradelockerSources.listInstrumentsForSourceKey,
  );

  const sourceKey = usePlatformPriceDataStore((s) => s.sourceKey);
  const setSourceKey = usePlatformPriceDataStore((s) => s.setSourceKey);
  const pairSearch = usePlatformPriceDataStore((s) => s.pairSearch);
  const setPairSearch = usePlatformPriceDataStore((s) => s.setPairSearch);
  const tradableInstrumentId = usePlatformPriceDataStore((s) => s.tradableInstrumentId);
  const symbol = usePlatformPriceDataStore((s) => s.symbol);
  const setInstrument = usePlatformPriceDataStore((s) => s.setInstrument);

  const [brokers, setBrokers] = React.useState<
    Array<{ sourceKey: string; label: string }> | null
  >(null);
  const [pairs, setPairs] = React.useState<
    Array<{ tradableInstrumentId: string; symbol: string }> | null
  >(null);
  const [loadingBrokers, setLoadingBrokers] = React.useState(false);
  const [loadingPairs, setLoadingPairs] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingBrokers(true);
    listConfiguredSources({})
      .then((rows) => {
        if (cancelled) return;
        setBrokers(rows.map((r) => ({ sourceKey: r.sourceKey, label: r.label })));
      })
      .catch(() => {
        if (cancelled) return;
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
    if (!sourceKey) return;

    setLoadingPairs(true);
    const q = pairSearch.trim() || undefined;
    const t = setTimeout(() => {
      listInstrumentsForSourceKey({ sourceKey, search: q, limit: 400 })
        .then((rows) => {
          if (cancelled) return;
          setPairs(rows.map((r) => ({ tradableInstrumentId: r.tradableInstrumentId, symbol: r.symbol })));
        })
        .catch(() => {
          if (cancelled) return;
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

  const filteredPairs = React.useMemo(() => {
    const q = pairSearch.trim().toLowerCase();
    if (!q) return pairs ?? [];
    return (pairs ?? []).filter((p) => p.symbol.toLowerCase().includes(q));
  }, [pairSearch, pairs]);

  const handlePickPair = (value: string) => {
    const [id, sym] = value.split("|");
    setInstrument({ tradableInstrumentId: id ?? "", symbol: sym ?? "" });
  };

  return (
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
          ) : (filteredPairs ?? []).length === 0 ? (
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
    </div>
  );
};

