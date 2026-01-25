"use client";

import * as React from "react";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

export default function PublicUserTradeIdeasPage() {
  const params = useParams<{ username?: string }>();
  const decoded = decodeURIComponent(String(params.username ?? ""));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const ideas = useQuery(api.traderlaunchpad.public.listPublicTradeIdeas, {
    username: decoded,
    limit: 50,
  }) as
    | {
      tradeIdeaId: string;
      symbol: string;
      bias: "long" | "short" | "neutral";
      timeframe: string;
      timeframeLabel?: string;
      status: "active" | "closed";
      openedAt: number;
      lastActivityAt: number;
    }[]
    | undefined;

  return (
    <div className="grid gap-4">


      <div className="grid gap-4">
        {ideas === undefined ? (
          <div className="rounded-3xl border border-white/10 bg-white/3 p-7 text-sm text-white/60 backdrop-blur-md">
            Loading…
          </div>
        ) : ideas.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/3 p-7 text-sm text-white/60 backdrop-blur-md">
            No public trade ideas yet.
          </div>
        ) : (
          ideas.map((t) => (
            <Link
              key={t.tradeIdeaId}
              href={`/u/${encodeURIComponent(decoded)}/tradeidea/${encodeURIComponent(t.tradeIdeaId)}`}
              className="group rounded-3xl border border-white/10 bg-white/3 p-6 backdrop-blur-md transition-colors hover:bg-white/6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-white/90">{t.symbol}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/70">
                      {t.bias === "long" ? "Long" : t.bias === "short" ? "Short" : "Neutral"}
                    </div>
                    <div className="text-xs text-white/45">{toDateLabel(t.openedAt)}</div>
                  </div>
                  <div className="mt-2 text-sm text-white/60">
                    {t.timeframeLabel ?? t.timeframe} • {t.status === "active" ? "Active" : "Closed"}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/60 group-hover:text-white">
                    View trade idea <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}

