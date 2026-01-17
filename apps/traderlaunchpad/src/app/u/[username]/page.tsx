import {
  ArrowLeft,
  Award,
  BarChart3,
  Crown,
  ExternalLink,
  Shield,
  TrendingUp,
} from "lucide-react";
import { demoPublicProfiles, demoPublicUsers } from "@acme/demo-data";

import { AffiliatePageShell } from "../../../components/affiliates/AffiliatePageShell";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { notFound } from "next/navigation";

type PublicUser = {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  isPublic: boolean;
  primaryBroker: string;
  stats: {
    balance: number;
    winRate: number;
    profitFactor: number;
    avgRiskReward: number;
    monthlyReturn: number;
    streak: number;
  };
  badges: Array<{ id: string; label: string; description?: string; tone?: string }>;
  leaderboards: Array<{ id: string; label: string; rank: number; total: number }>;
  recentTrades: Array<{
    id: string;
    symbol: string;
    side: "Long" | "Short";
    dateLabel: string;
    pnl: number;
    rMultiple: number;
    setup: string;
  }>;
};

const toneToClasses = (tone?: string) => {
  switch (tone) {
    case "orange":
      return "border-orange-500/25 bg-orange-500/10 text-orange-200";
    case "emerald":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    case "sky":
      return "border-sky-500/25 bg-sky-500/10 text-sky-200";
    case "violet":
      return "border-violet-500/25 bg-violet-500/10 text-violet-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
};

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const users = demoPublicUsers as unknown as PublicUser[];
  const user = users.find((u) => u.username === decoded);

  // Allow fallback to marquee-only profile for now.
  const profileOnly = (demoPublicProfiles as unknown as Array<any>).find(
    (p) => p.username === decoded,
  );

  if (!user && !profileOnly) return notFound();
  if (user && !user.isPublic) return notFound();

  const displayName = user?.displayName ?? profileOnly?.username ?? decoded;
  const avatarUrl = user?.avatarUrl ?? profileOnly?.avatarUrl;
  const bio =
    user?.bio ??
    "Public profile preview. Connect your broker, journal trades, and share your edge with the fleet.";

  return (
    <AffiliatePageShell
      title={displayName}
      subtitle={`@${decoded} • Public profile`}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All users
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-3 text-sm text-white/60">
          <Link
            href="/brokers"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            Brokers <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/firms"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            Prop firms <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile + badges */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl ?? ""}
                  alt={decoded}
                  className="h-full w-full object-cover opacity-95"
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-xl font-bold text-white">
                  {displayName}
                </div>
                <div className="mt-1 text-sm text-white/55">@{decoded}</div>
                <div className="mt-3 text-sm leading-relaxed text-white/65">
                  {bio}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Shield className="h-4 w-4 text-orange-200/80" />
                Connected broker
              </div>
              <div className="mt-2 text-sm text-white/70">
                {user?.primaryBroker ?? "—"}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Award className="h-4 w-4 text-orange-200/80" />
                Badges
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user?.badges ?? []).slice(0, 8).map((b) => (
                  <span
                    key={b.id}
                    className={[
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      toneToClasses(b.tone),
                    ].join(" ")}
                    title={b.description ?? b.label}
                  >
                    {b.label}
                  </span>
                ))}
                {!user?.badges?.length ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/60">
                    No badges yet
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stats + leaderboards + trades */}
        <div className="lg:col-span-2">
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <BarChart3 className="h-4 w-4 text-orange-200/80" />
                  Win rate
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {user ? `${user.stats.winRate}%` : "—"}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <TrendingUp className="h-4 w-4 text-orange-200/80" />
                  Profit factor
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {user ? user.stats.profitFactor.toFixed(1) : "—"}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <Crown className="h-4 w-4 text-orange-200/80" />
                  Streak
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {user ? `${user.stats.streak} days` : "—"}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-md">
              <div className="text-sm font-semibold text-white/80">
                Leaderboards
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(user?.leaderboards ?? []).slice(0, 6).map((lb) => (
                  <div
                    key={lb.id}
                    className="rounded-2xl border border-white/10 bg-white/3 p-4"
                  >
                    <div className="text-xs font-medium text-white/55">
                      {lb.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/85">
                      Rank #{lb.rank}{" "}
                      <span className="text-white/40">/ {lb.total}</span>
                    </div>
                  </div>
                ))}
                {!user?.leaderboards?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
                    No rankings yet
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-7 backdrop-blur-md">
              <div className="text-sm font-semibold text-white/80">
                Recent trades
              </div>
              <div className="mt-4 grid gap-3">
                {(user?.recentTrades ?? []).slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-white/85">
                          {t.symbol}
                        </div>
                        <div className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] font-medium text-white/60">
                          {t.side}
                        </div>
                        <div className="text-xs text-white/45">{t.dateLabel}</div>
                      </div>
                      <div className="mt-1 truncate text-xs text-white/50">
                        {t.setup}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={[
                          "text-sm font-semibold",
                          t.pnl >= 0 ? "text-emerald-200" : "text-rose-200",
                        ].join(" ")}
                      >
                        {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                      </div>
                      <div className="text-xs text-white/45">
                        {t.rMultiple >= 0 ? `+${t.rMultiple}` : t.rMultiple}R
                      </div>
                    </div>
                  </div>
                ))}
                {!user?.recentTrades?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-sm text-white/60">
                    No trades shared yet
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

