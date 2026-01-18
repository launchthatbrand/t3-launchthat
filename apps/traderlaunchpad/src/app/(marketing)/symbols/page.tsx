import { ArrowRight, Search } from "lucide-react";
import { demoPublicUsers, demoReviewTrades } from "@acme/demo-data";

import { AffiliatePageShell } from "../../../components/affiliates/AffiliatePageShell";
import Link from "next/link";
import React from "react";

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

export default async function SymbolsArchivePage() {
  const symbolsFromUsers = demoPublicUsers.flatMap((u) =>
    (u.recentTrades ?? []).map((t) => normalizeSymbol(t.symbol)),
  );
  const symbolsFromReviewTrades = demoReviewTrades.map((t) =>
    normalizeSymbol(t.symbol),
  );

  const symbols = Array.from(new Set([...symbolsFromUsers, ...symbolsFromReviewTrades]))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const statsBySymbol = new Map<
    string,
    { tradeCount: number; traderCount: number; lastSeen?: string }
  >();

  for (const symbol of symbols) {
    const traders = new Set<string>();
    let tradeCount = 0;
    for (const u of demoPublicUsers) {
      const hits = (u.recentTrades ?? []).filter(
        (t) => normalizeSymbol(t.symbol) === symbol,
      );
      if (hits.length > 0) {
        traders.add(u.username);
        tradeCount += hits.length;
      }
    }
    const lastSeen =
      demoReviewTrades.find((t) => normalizeSymbol(t.symbol) === symbol)?.date ??
      undefined;
    statsBySymbol.set(symbol, {
      tradeCount,
      traderCount: traders.size,
      lastSeen,
    });
  }

  return (
    <AffiliatePageShell title="Symbols" subtitle="Archive of traded symbols">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
          <Search className="h-4 w-4 text-white/50" />
          Using symbols from demo trades + mock chart data
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {symbols.map((symbol) => {
          const stat = statsBySymbol.get(symbol);
          return (
            <Link
              key={symbol}
              href={`/s/${encodeURIComponent(symbol)}`}
              className="group rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors hover:bg-white/6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-white/90">
                    {symbol}
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    {stat ? (
                      <>
                        {stat.traderCount} trader{stat.traderCount === 1 ? "" : "s"} •{" "}
                        {stat.tradeCount} trade{stat.tradeCount === 1 ? "" : "s"}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AffiliatePageShell>
  );
}

