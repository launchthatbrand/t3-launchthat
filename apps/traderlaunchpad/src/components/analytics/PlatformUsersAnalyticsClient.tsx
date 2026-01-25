"use client";

import * as React from "react";

import { useConvexAuth, useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@acme/ui/chart";

import { api } from "@convex-config/_generated/api";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const pct = (n: number, d: number) => {
  if (!d || d <= 0) return 0;
  const value = (n / d) * 100;
  if (!Number.isFinite(value)) return 0;
  return value;
};

export function PlatformUsersAnalyticsClient() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const [preset, setPreset] = React.useState<"all" | "7d" | "30d" | "90d" | "custom">("all");
  const [fromMs, setFromMs] = React.useState<number | null>(null);
  const [toMs, setToMs] = React.useState<number | null>(null);

  const summary = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    api.platform.queries.getPlatformUsersAnalytics,
    shouldQuery
      ? {
          rangePreset: preset,
          fromMs: preset === "custom" ? fromMs ?? undefined : undefined,
          toMs: toMs ?? undefined,
          granularity: "auto",
          usersCap: 10_000,
          maxComponentRows: 250_000,
        }
      : "skip",
  ) as
    | {
        range: {
          preset: string;
          fromMs: number;
          toMs: number;
          chartFromMs: number;
          granularity: "day" | "month";
        };
        users: { scanned: number; isTruncated: boolean };
        funnel: { registered: number; connectedBroker: number; syncedAtLeastOneOrder: number };
        timeSeries: Array<{
          period: string;
          registered: number;
          connectedBroker: number;
          syncedAtLeastOneOrder: number;
        }>;
        timeToConnectBuckets: Array<{ bucket: string; count: number }>;
        timeToSyncBuckets: Array<{ bucket: string; count: number }>;
        cohortsWeekly: Array<{
          cohortWeek: string;
          registered: number;
          connectedWithin7d: number;
          syncedWithin7d: number;
        }>;
      }
    | undefined;

  const registered = summary?.funnel.registered ?? 0;
  const connected = summary?.funnel.connectedBroker ?? 0;
  const synced = summary?.funnel.syncedAtLeastOneOrder ?? 0;

  const conversions = {
    connectedPct: pct(connected, registered),
    syncedPct: pct(synced, connected),
  };

  const chartConfig = {
    // TraderLaunchpad theme defines --chart-* as full `oklch(...)` values, so don't wrap in hsl().
    registered: { label: "Registered", color: "var(--chart-1)" },
    connectedBroker: { label: "Connected", color: "var(--chart-2)" },
    syncedAtLeastOneOrder: { label: "Synced", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  const funnelData = [
    { step: "Registered", value: registered, color: "var(--color-registered)" },
    { step: "Connected", value: connected, color: "var(--color-connectedBroker)" },
    { step: "Synced", value: synced, color: "var(--color-syncedAtLeastOneOrder)" },
  ];

  const cohortsPctData =
    summary?.cohortsWeekly.map((c) => ({
      cohortWeek: c.cohortWeek,
      connectedWithin7dPct: pct(c.connectedWithin7d, c.registered),
      syncedWithin7dPct: pct(c.syncedWithin7d, c.registered),
      registered: c.registered,
    })) ?? [];

  const rangeLabel = summary
    ? summary.range.granularity === "month"
      ? "Monthly"
      : "Daily"
    : "";

  const handlePreset = (p: "all" | "7d" | "30d" | "90d" | "custom") => {
    setPreset(p);
    // For custom, default to last 30d.
    if (p === "custom") {
      const now = Date.now();
      setToMs(now);
      setFromMs(now - 30 * 24 * 60 * 60 * 1000);
    }
  };

  const toDateInputValue = (ms: number | null) => {
    if (!ms) return "";
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fromDateInput = (value: string) => {
    // Interpret as local date start.
    const ms = Date.parse(`${value}T00:00:00`);
    return Number.isFinite(ms) ? ms : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">User analytics</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Onboarding funnel and trends (registered → connected broker → synced ≥ 1 order/trade).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground text-xs">Range</div>
          <div className="inline-flex overflow-hidden rounded-md border">
            {(
              [
                { id: "all", label: "All time" },
                { id: "7d", label: "7d" },
                { id: "30d", label: "30d" },
                { id: "90d", label: "90d" },
                { id: "custom", label: "Custom" },
              ] as const
            ).map((t) => {
              const active = preset === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handlePreset(t.id)}
                  className={[
                    "px-3 py-1.5 text-sm",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {preset === "custom" ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs">From</div>
            <input
              type="date"
              className="bg-background h-9 rounded-md border px-3 text-sm"
              value={toDateInputValue(fromMs)}
              onChange={(e) => setFromMs(fromDateInput(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs">To</div>
            <input
              type="date"
              className="bg-background h-9 rounded-md border px-3 text-sm"
              value={toDateInputValue(toMs)}
              onChange={(e) => {
                const ms = fromDateInput(e.target.value);
                if (ms === null) return;
                // end-of-day local
                setToMs(ms + 24 * 60 * 60 * 1000 - 1);
              }}
            />
          </div>
          <div className="text-muted-foreground text-xs">
            {summary ? `${rangeLabel} buckets (auto)` : ""}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">{summary ? `${rangeLabel} buckets (auto)` : ""}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Registered</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary ? registered.toLocaleString() : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Connected broker</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary ? connected.toLocaleString() : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Synced ≥ 1 order/trade</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary ? synced.toLocaleString() : "—"}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funnel</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="step"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={6}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.step} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="text-muted-foreground mt-3 text-xs">
              {summary
                ? `${conversions.connectedPct.toFixed(1)}% connect · ${conversions.syncedPct.toFixed(1)}% sync`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              User growth ({summary ? summary.range.granularity : "—"})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={summary?.timeSeries ?? []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="registered"
                  stroke="var(--color-registered)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="connectedBroker"
                  stroke="var(--color-connectedBroker)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="syncedAtLeastOneOrder"
                  stroke="var(--color-syncedAtLeastOneOrder)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time to connect (bucketed)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer
              config={{ count: { label: "Users", color: "var(--chart-2)" } }}
              className="h-64 w-full"
            >
              <BarChart data={summary?.timeToConnectBuckets ?? []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time to first sync (bucketed)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer
              config={{ count: { label: "Users", color: "var(--chart-3)" } }}
              className="h-64 w-full"
            >
              <BarChart data={summary?.timeToSyncBuckets ?? []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weekly cohorts (conversion within 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartContainer
            config={{
              connectedWithin7dPct: { label: "Connected ≤7d (%)", color: "var(--chart-2)" },
              syncedWithin7dPct: { label: "Synced ≤7d (%)", color: "var(--chart-3)" },
            }}
            className="h-72 w-full"
          >
            <LineChart data={cohortsPctData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="cohortWeek" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="connectedWithin7dPct"
                stroke="var(--color-connectedWithin7dPct)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="syncedWithin7dPct"
                stroke="var(--color-syncedWithin7dPct)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
          <div className="text-muted-foreground mt-2 text-xs">
            {summary
              ? `Scanned ${summary.users.scanned.toLocaleString()} users${
                  summary.users.isTruncated ? " (truncated)" : ""
                }.`
              : "—"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

