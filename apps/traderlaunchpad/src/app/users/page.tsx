import { demoPublicProfiles, demoPublicUsers } from "@acme/demo-data";

import { AffiliatePageShell } from "../../components/affiliates/AffiliatePageShell";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";

type PublicUserListItem = {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  headline?: string;
  primaryBroker?: string;
  winRate?: number;
  profitFactor?: number;
  streak?: number;
};

export default function UsersArchivePage() {
  const byUsername: Record<string, PublicUserListItem> = {};

  // Seed from full profiles (richer data).
  for (const u of demoPublicUsers as unknown as Array<any>) {
    byUsername[u.username] = {
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      primaryBroker: u.primaryBroker,
      winRate: u.stats?.winRate,
      profitFactor: u.stats?.profitFactor,
      streak: u.stats?.streak,
    };
  }

  // Fill in remaining from marquee profiles.
  for (const p of demoPublicProfiles as unknown as Array<any>) {
    if (!byUsername[p.username]) {
      byUsername[p.username] = {
        username: p.username,
        displayName: p.username,
        avatarUrl: p.avatarUrl,
        headline: p.headline,
      };
    }
  }

  const users = Object.values(byUsername).sort((a, b) =>
    a.username.localeCompare(b.username),
  );

  return (
    <AffiliatePageShell
      title="Public trader profiles"
      subtitle="Browse traders who opted into public profiles. View stats, badges, brokers, and recent trades."
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/60">
          Showing <span className="font-semibold text-white/80">{users.length}</span>{" "}
          public profiles
        </div>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/sign-up">Create your profile</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Link
            key={u.username}
            href={`/u/${encodeURIComponent(u.username)}`}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors duration-300 hover:border-white/20 hover:bg-white/6"
          >
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-orange-500/10 via-transparent to-white/6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.avatarUrl ?? ""}
                  alt={u.username}
                  className="h-full w-full object-cover opacity-95"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-base font-semibold text-white">
                    {u.displayName ?? u.username}
                  </div>
                  {typeof u.streak === "number" ? (
                    <div className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-200">
                      {u.streak}-day streak
                    </div>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-white/55">@{u.username}</div>
                <div className="mt-2 text-sm text-white/60">
                  {u.headline ?? (u.primaryBroker ? `Broker: ${u.primaryBroker}` : "Public journal")}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[11px] font-medium text-white/50">
                      Win rate
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/85">
                      {typeof u.winRate === "number" ? `${u.winRate}%` : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[11px] font-medium text-white/50">
                      Profit factor
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/85">
                      {typeof u.profitFactor === "number"
                        ? u.profitFactor.toFixed(1)
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

