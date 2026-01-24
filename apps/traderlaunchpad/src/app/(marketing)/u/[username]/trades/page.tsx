import { ArrowUpRight } from "lucide-react";
import { demoPublicProfiles, demoPublicUsers, demoReviewTrades } from "@acme/demo-data";

import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

interface PublicUser {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  isPublic: boolean;
  primaryBroker: string;
  recentTrades: {
    id: string;
    symbol: string;
    side: "Long" | "Short";
    dateLabel: string;
    pnl: number;
    rMultiple: number;
    setup: string;
  }[];
}

interface PublicProfileOnly {
  username: string;
  avatarUrl?: string;
}

const getTradeIdForPublicTrade = (t: { symbol: string; side: "Long" | "Short" }) => {
  const match = demoReviewTrades.find((rt) => rt.symbol === t.symbol && rt.type === t.side);
  if (match) return match.id;
  const idx =
    Math.abs(Array.from(t.symbol).reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    demoReviewTrades.length;
  return demoReviewTrades[idx]?.id ?? "1";
};

export default async function PublicUserTradesPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const users = demoPublicUsers as unknown as PublicUser[];
  const user = users.find((u) => u.username.toLowerCase() === decoded.toLowerCase());

  const profiles = demoPublicProfiles as unknown as PublicProfileOnly[];
  const profileOnly = profiles.find((p) => p.username.toLowerCase() === decoded.toLowerCase());

  // If the user exists in demo data but is marked private, keep 404.
  if (user && !user.isPublic) return notFound();

  const displayName = user?.displayName ?? profileOnly?.username ?? decoded;
  const trades = user?.recentTrades ?? [];

  return (
    <div className="grid gap-4">
      <div className="mb-2">
        <div className="text-sm text-white/55">@{decoded}</div>
        <h2 className="text-2xl font-bold tracking-tight text-white">{displayName} — Trades</h2>
        <div className="mt-2 text-sm text-white/60">Public trades shared by this user.</div>
      </div>

      <div className="grid gap-4">
        {trades.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/3 p-7 text-sm text-white/60 backdrop-blur-md">
            No public trades yet.
          </div>
        ) : (
          trades.map((t) => {
            const tradeId = getTradeIdForPublicTrade(t);
            return (
              <Link
                key={t.id}
                href={`/u/${encodeURIComponent(decoded)}/tradeidea/${tradeId}`}
                className="group rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors hover:bg-white/6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-white/90">{t.symbol}</div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70">
                        {t.side}
                      </div>
                      <div className="text-xs text-white/45">{t.dateLabel}</div>
                    </div>
                    <div className="mt-2 text-sm text-white/60">{t.setup}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className={[
                        "text-sm font-semibold",
                        t.pnl >= 0 ? "text-emerald-200" : "text-rose-200",
                      ].join(" ")}
                    >
                      {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      {t.rMultiple >= 0 ? `+${t.rMultiple}` : t.rMultiple}R
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/60 group-hover:text-white">
                      View trade <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}

