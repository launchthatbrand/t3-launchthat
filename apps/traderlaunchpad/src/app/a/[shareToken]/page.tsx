"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";

import { api } from "@convex-config/_generated/api";

const weekdayLabels: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

const formatMoney = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
};

const formatPct = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return `${Math.round(v * 100)}%`;
};

const Chip = (props: { label: string; value: string; muted?: boolean }) => {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
        props.muted ? "border-white/10 bg-white/5 text-white/60" : "border-orange-500/25 bg-orange-500/10 text-orange-200",
      ].join(" ")}
    >
      <span className="font-medium">{props.label}</span>
      <span className="text-white/70">{props.value}</span>
    </div>
  );
};

export default function SharedAnalyticsReportPage() {
  const params = useParams<{ shareToken?: string | string[] }>();
  const raw = params.shareToken;
  const shareTokenRaw = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const shareToken = String(shareTokenRaw).trim();

  const shared = useQuery(api.traderlaunchpad.queries.getSharedAnalyticsReport, {
    shareToken,
  }) as unknown as
    | {
        name: string;
        spec: {
          version: number;
          timezone?: string;
          rangePreset?: string;
          fromMs?: number;
          toMs?: number;
          weekdays?: number[];
          symbols?: string[];
          direction?: ("long" | "short")[];
          includeUnrealized?: boolean;
        };
        result: {
          headline: {
            netPnl: number;
            realizedPnl: number;
            unrealizedPnl: number;
            winRate: number;
            profitFactor: number;
            totalFees: number;
          };
          bySymbol: { symbol: string; pnl: number; closeEventCount: number }[];
        };
      }
    | null
    | undefined;

  if (!shareToken) {
    return <div className="p-6 text-sm text-muted-foreground">Invalid link.</div>;
  }

  if (shared === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!shared) {
    return <div className="p-6 text-sm text-muted-foreground">Report not found.</div>;
  }

  const h = shared.result.headline;
  const s = shared.spec;

  const weekdayText =
    Array.isArray(s.weekdays) && s.weekdays.length > 0
      ? s.weekdays.map((d) => weekdayLabels[d] ?? String(d)).join(", ")
      : "All";

  const symbolsText =
    Array.isArray(s.symbols) && s.symbols.length > 0 ? s.symbols.join(", ") : "All";

  const directionText =
    Array.isArray(s.direction) && s.direction.length > 0 ? s.direction.join(", ") : "All";

  const rangeText =
    s.rangePreset === "custom" && typeof s.fromMs === "number" && typeof s.toMs === "number"
      ? `${new Date(s.fromMs).toLocaleDateString()} → ${new Date(s.toMs).toLocaleDateString()}`
      : typeof s.rangePreset === "string"
        ? s.rangePreset
        : "30d";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-white selection:bg-orange-500/30">
      <div>
        <div className="text-sm text-white/55">Shared analytics report</div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {shared.name}
        </h1>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="text-sm font-semibold text-white">Filters</div>
        <div className="mt-1 text-sm text-white/55">Exact settings used to compute this report.</div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip
            label="Timezone"
            value={s.timezone ?? "UTC"}
            muted={!s.timezone || s.timezone === "UTC"}
          />
          <Chip label="Range" value={rangeText} muted={rangeText === "30d"} />
          <Chip label="Weekdays" value={weekdayText} muted={weekdayText === "All"} />
          <Chip label="Symbols" value={symbolsText} muted={symbolsText === "All"} />
          <Chip label="Direction" value={directionText} muted={directionText === "All"} />
          <Chip
            label="Include unrealized"
            value={s.includeUnrealized === false ? "No" : "Yes"}
            muted={s.includeUnrealized !== false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
          <div className="text-xs font-medium text-white/55">Net PnL</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(h.netPnl)}</div>
          <div className="mt-2 text-xs text-white/50">
            Realized {formatMoney(h.realizedPnl)} • Unrealized {formatMoney(h.unrealizedPnl)}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
          <div className="text-xs font-medium text-white/55">Win rate</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatPct(h.winRate)}</div>
          <div className="mt-2 text-xs text-white/50">
            Profit factor {h.profitFactor.toFixed(2)}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
          <div className="text-xs font-medium text-white/55">Fees</div>
          <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(h.totalFees)}</div>
          <div className="mt-2 text-xs text-white/50">From close events</div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="text-sm font-semibold text-white">Top symbols</div>
        <div className="mt-1 text-sm text-white/55">Best performers in this report.</div>
        <div className="mt-4 space-y-2">
          {shared.result.bySymbol.slice(0, 10).map((r, idx) => (
            <div
              key={`${r.symbol}-${idx}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/3 px-4 py-3 text-sm"
            >
              <div className="text-white/70">{r.symbol}</div>
              <div className="tabular-nums text-white">{formatMoney(r.pnl)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

