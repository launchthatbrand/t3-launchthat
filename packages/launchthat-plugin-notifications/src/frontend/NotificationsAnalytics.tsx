"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@acme/ui/chart";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

export type NotificationsAnalyticsSummary = {
  fromCreatedAt: number;
  timeSeriesDaily: Array<{ date: string; sent: number; interactions: number; ctrPct: number }>;
  interactionsByChannelDaily: Array<{
    date: string;
    push: number;
    inApp: number;
    email: number;
    other: number;
  }>;
  sent: {
    notifications: number;
    byEventKey: Array<{ eventKey: string; count: number }>;
  };
  interactions: {
    events: number;
    uniqueNotifications: number;
    uniqueUsers: number;
    byEventKey: Array<{ eventKey: string; count: number }>;
    byChannelAndType: Array<{ channel: string; eventType: string; count: number }>;
  };
  eventKeyMetrics: Array<{ eventKey: string; sent: number; interactions: number; ctrPct: number }>;
};

const formatDateTime = (ms: number) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(ms));
  } catch {
    return "";
  }
};

export const NotificationsAnalytics = (props: {
  summary: NotificationsAnalyticsSummary | null | undefined;
  daysBack: number;
}) => {
  const summary = props.summary;

  const chartConfig = {
    // TraderLaunchpad theme defines --chart-* as full `oklch(...)` values, so don't wrap in hsl().
    sent: { label: "Sent", color: "var(--chart-1)" },
    interactions: { label: "Interactions", color: "var(--chart-2)" },
    ctrPct: { label: "CTR (%)", color: "var(--chart-3)" },
    push: { label: "Push", color: "var(--chart-1)" },
    inApp: { label: "In-app", color: "var(--chart-2)" },
    email: { label: "Email", color: "var(--chart-3)" },
    other: { label: "Other", color: "var(--chart-4)" },
  } satisfies ChartConfig;

  const topEventKeys = summary?.eventKeyMetrics?.slice(0, 12) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Notifications analytics</h2>
        <p className="text-muted-foreground text-sm">
          Showing the last {props.daysBack} days{" "}
          {summary ? `(since ${formatDateTime(summary.fromCreatedAt)})` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.sent.notifications.toLocaleString() : "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.interactions.events.toLocaleString() : "—"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary ? summary.interactions.uniqueUsers.toLocaleString() : "—"}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent vs interactions (daily)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={summary?.timeSeriesDaily ?? []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="var(--color-sent)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="interactions"
                  stroke="var(--color-interactions)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CTR (daily)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={summary?.timeSeriesDaily ?? []} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="ctrPct"
                  stroke="var(--color-ctrPct)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Interactions by channel (daily)</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={summary?.interactionsByChannelDaily ?? []} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="push"
                stackId="a"
                stroke="var(--color-push)"
                fill="var(--color-push)"
                fillOpacity={0.25}
              />
              <Area
                type="monotone"
                dataKey="inApp"
                stackId="a"
                stroke="var(--color-inApp)"
                fill="var(--color-inApp)"
                fillOpacity={0.25}
              />
              <Area
                type="monotone"
                dataKey="email"
                stackId="a"
                stroke="var(--color-email)"
                fill="var(--color-email)"
                fillOpacity={0.25}
              />
              <Area
                type="monotone"
                dataKey="other"
                stackId="a"
                stroke="var(--color-other)"
                fill="var(--color-other)"
                fillOpacity={0.25}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top event keys (sent vs interactions)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {!summary || topEventKeys.length === 0 ? (
              <div className="text-muted-foreground text-sm">No events yet.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={topEventKeys} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="eventKey"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tickFormatter={(v) => String(v).split(".").slice(-1)[0] ?? ""}
                  />
                  <YAxis tickLine={false} axisLine={false} width={44} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
                  <Bar dataKey="interactions" fill="var(--color-interactions)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top event keys (CTR %)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {!summary || topEventKeys.length === 0 ? (
              <div className="text-muted-foreground text-sm">No events yet.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={topEventKeys} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="eventKey"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={60}
                    tickFormatter={(v) => String(v).split(".").slice(-1)[0] ?? ""}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ctrPct" fill="var(--color-ctrPct)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By channel + event type</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || summary.interactions.byChannelAndType.length === 0 ? (
            <div className="text-muted-foreground text-sm">No events yet.</div>
          ) : (
            <div className="divide-border divide-y">
              {summary.interactions.byChannelAndType.map((row) => (
                <div
                  key={`${row.channel}:${row.eventType}`}
                  className="flex items-center justify-between py-2"
                >
                  <div className="text-sm">
                    <span className="font-mono">{row.channel || "—"}</span>{" "}
                    <span className="text-muted-foreground">/</span>{" "}
                    <span className="font-mono">{row.eventType || "—"}</span>
                  </div>
                  <div className="text-sm font-medium">{row.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

