import { ArrowLeft, ArrowUpRight, BarChart3 } from "lucide-react";
import { demoPublicUsers, demoReviewTrades } from "@acme/demo-data";

import { AffiliatePageShell } from "../../../../components/affiliates/AffiliatePageShell";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

const getTradeIdForPublicTrade = (t: { symbol: string; side: "Long" | "Short" }) => {
  const match = demoReviewTrades.find(
    (rt) => normalizeSymbol(rt.symbol) === normalizeSymbol(t.symbol) && rt.type === t.side,
  );
  if (match) return match.id;
  const idx =
    Math.abs(
      Array.from(t.symbol).reduce((acc, c) => acc + c.charCodeAt(0), 0),
    ) % demoReviewTrades.length;
  return demoReviewTrades[idx]?.id ?? "1";
};

export default async function SymbolDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const decoded = decodeURIComponent(symbol);
  const canonical = normalizeSymbol(decoded);

  const allSymbols = new Set<string>([
    ...demoPublicUsers.flatMap((u) =>
      (u.recentTrades ?? []).map((t) => normalizeSymbol(t.symbol)),
    ),
    ...demoReviewTrades.map((t) => normalizeSymbol(t.symbol)),
  ]);

  if (!allSymbols.has(canonical)) {
    notFound();
  }

  const tradesByUser = demoPublicUsers
    .map((u) => {
      const trades = (u.recentTrades ?? []).filter(
        (t) => normalizeSymbol(t.symbol) === canonical,
      );
      if (trades.length === 0) return null;
      return { user: u, trades };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const tradeCount = tradesByUser.reduce((acc, x) => acc + x.trades.length, 0);
  const traderCount = tradesByUser.length;

  const reviewTrades = demoReviewTrades
    .filter((t) => normalizeSymbol(t.symbol) === canonical)
    .slice(0, 12);

  return (
    <AffiliatePageShell
      title={canonical}
      subtitle="Symbol overview • Public demo data"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/symbols">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to symbols
          </Link>
        </Button>

        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <BarChart3 className="h-4 w-4 text-white/40" />
          {traderCount} trader{traderCount === 1 ? "" : "s"} • {tradeCount} trade
          {tradeCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/3 p-7 backdrop-blur-md">
            <div className="text-sm font-semibold text-white/80">
              Traders trading {canonical}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-12 gap-2 bg-black/40 px-5 py-3 text-xs font-semibold text-white/60">
                <div className="col-span-4">Trader</div>
                <div className="col-span-6">Latest trades</div>
                <div className="col-span-2 text-right">Open</div>
              </div>
              {tradesByUser.length === 0 ? (
                <div className="px-5 py-6 text-sm text-white/60">
                  No public trades found for this symbol yet.
                </div>
              ) : (
                tradesByUser.map(({ user, trades }) => {
                  const recent = trades.slice(0, 2);
                  return (
                    <div
                      key={user.username}
                      className="grid grid-cols-12 gap-2 border-t border-white/5 px-5 py-4 text-sm text-white/80"
                    >
                      <div className="col-span-4 min-w-0">
                        <Link
                          href={`/u/${encodeURIComponent(user.username)}`}
                          className="font-semibold text-white hover:text-white/90"
                        >
                          {user.username}
                        </Link>
                        <div className="mt-1 text-xs text-white/50">
                          {user.stats.winRate}% win • {user.stats.monthlyReturn}% ROI
                        </div>
                      </div>
                      <div className="col-span-6 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
                          {recent.map((t) => (
                            <span
                              key={t.id}
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-1"
                            >
                              {t.side} • {t.dateLabel} •{" "}
                              <span className={t.pnl >= 0 ? "text-emerald-200" : "text-rose-200"}>
                                {t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Link
                          href={`/u/${encodeURIComponent(user.username)}/tradeidea/${getTradeIdForPublicTrade(trades[0]!)}`}
                          className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
                        >
                          View
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
            <div className="text-sm font-semibold text-white/80">
              Mock chart trades
            </div>
            <div className="mt-3 text-sm text-white/60">
              Trades used by the public trade view / chart mocks for {canonical}.
            </div>
            <div className="mt-4 grid gap-2">
              {reviewTrades.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  No demo review trades found for this symbol.
                </div>
              ) : (
                reviewTrades.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-white/80">
                        {t.type} • {t.date}
                      </div>
                      <div className="text-xs text-white/50">id: {t.id}</div>
                    </div>
                    <div className="mt-2 text-xs text-white/55">{t.reason}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AffiliatePageShell>
  );
}

