"use client";

import * as React from "react";
import Link from "next/link";
import { useAction } from "convex/react";
import {
  addWeeks,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";

type RangePreset = "today" | "thisWeek" | "nextWeek";
type ImpactFilter = "all" | "high" | "medium" | "low" | "unknown";

interface EconomicEventRow {
  _id: string;
  title: string;
  summary?: string;
  startsAt?: number;
  impact?: string;
  country?: string;
  currency?: string;
}

const impactKey = (impact?: string): ImpactFilter => {
  const v = String(impact ?? "")
    .trim()
    .toLowerCase();
  if (!v) return "unknown";
  if (v.includes("high")) return "high";
  if (v.includes("med")) return "medium";
  if (v.includes("low")) return "low";
  return "unknown";
};

const ImpactBadge = ({ impact }: { impact?: string }) => {
  const key = impactKey(impact);
  if (key === "high") return <Badge variant="destructive">High</Badge>;
  if (key === "medium") return <Badge variant="secondary">Medium</Badge>;
  if (key === "low") return <Badge variant="outline">Low</Badge>;
  return <Badge variant="outline">—</Badge>;
};

const getPresetRange = (preset: RangePreset, anchor: Date) => {
  if (preset === "today") {
    const from = startOfDay(anchor);
    const to = endOfDay(anchor);
    return { from, to };
  }
  if (preset === "nextWeek") {
    const next = addWeeks(anchor, 1);
    const from = startOfWeek(next, { weekStartsOn: 0 });
    const to = endOfWeek(next, { weekStartsOn: 0 });
    return { from, to };
  }
  const from = startOfWeek(anchor, { weekStartsOn: 0 });
  const to = endOfWeek(anchor, { weekStartsOn: 0 });
  return { from, to };
};

export default function ForexEconomicCalendarPage() {
  const listGlobal = useAction(api.traderlaunchpad.actions.newsListGlobal);

  const [preset, setPreset] = React.useState<RangePreset>("thisWeek");
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  const [currency, setCurrency] = React.useState<string>("ALL");
  const [impact, setImpact] = React.useState<ImpactFilter>("all");
  const [query, setQuery] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<EconomicEventRow[]>([]);

  const { from, to } = React.useMemo(() => {
    const anchor = selectedDate ?? new Date();
    return getPresetRange(preset, anchor);
  }, [preset, selectedDate]);

  const rangeLabel = React.useMemo(() => {
    const a = format(from, "MMM d");
    const b = format(to, "MMM d");
    const y = format(from, "yyyy");
    return `${a} - ${b}, ${y}`;
  }, [from, to]);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = (await listGlobal({
          eventType: "economic",
          fromMs: from.getTime(),
          toMs: to.getTime(),
          limit: 500,
        })) as unknown;
        if (cancelled) return;
        setEvents(Array.isArray(res) ? (res as EconomicEventRow[]) : []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [from, listGlobal, to]);

  const availableCurrencies = React.useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      const c = String(e.currency ?? "")
        .trim()
        .toUpperCase();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [events]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => {
        if (currency !== "ALL") {
          const c = String(e.currency ?? "")
            .trim()
            .toUpperCase();
          if (c !== currency) return false;
        }
        if (impact !== "all") {
          if (impactKey(e.impact) !== impact) return false;
        }
        if (q) {
          const hay = `${e.title ?? ""} ${e.summary ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (selectedDate && typeof e.startsAt === "number") {
          return isSameDay(new Date(e.startsAt), selectedDate);
        }
        return true;
      })
      .sort((a, b) => Number(a.startsAt ?? 0) - Number(b.startsAt ?? 0));
  }, [currency, events, impact, query, selectedDate]);

  const grouped = React.useMemo(() => {
    const groups: Array<{ dayKey: string; dayLabel: string; rows: EconomicEventRow[] }> = [];
    const byKey = new Map<string, EconomicEventRow[]>();
    for (const e of filtered) {
      const d = typeof e.startsAt === "number" ? new Date(e.startsAt) : new Date(from);
      const key = format(d, "yyyy-MM-dd");
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(e);
    }
    const keys = Array.from(byKey.keys()).sort();
    for (const key of keys) {
      const rows = byKey.get(key) ?? [];
      const dayLabel = rows[0]?.startsAt ? format(new Date(rows[0].startsAt!), "EEE MMM d") : key;
      groups.push({ dayKey: key, dayLabel, rows });
    }
    return groups;
  }, [filtered, from]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">Forex economic calendar</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Economic events ingested into TraderLaunchpad.{" "}
          <Link href="/news" className="underline underline-offset-4 hover:text-foreground">
            View news feed
          </Link>
          .
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={preset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset("today")}
              >
                Today
              </Button>
              <Button
                type="button"
                variant={preset === "thisWeek" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset("thisWeek")}
              >
                This week
              </Button>
              <Button
                type="button"
                variant={preset === "nextWeek" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreset("nextWeek")}
              >
                Next week
              </Button>
            </div>

            <div className="rounded-lg border border-border/40">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d ?? undefined)}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedDate(undefined)}
              disabled={!selectedDate}
            >
              Clear day filter
            </Button>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b border-border/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm">This Week: {rangeLabel}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {loading
                    ? "Loading…"
                    : `${filtered.length} event${filtered.length === 1 ? "" : "s"} shown`}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events…"
                  className="h-9 w-full sm:w-56"
                />

                <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                  <SelectTrigger className="h-9 w-full sm:w-28">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    {availableCurrencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={impact} onValueChange={(v) => setImpact(v as ImpactFilter)}>
                  <SelectTrigger className="h-9 w-full sm:w-36">
                    <SelectValue placeholder="Impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All impact</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {error ? (
              <div className="p-4 text-sm text-red-600">{error}</div>
            ) : loading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading economic calendar…</div>
            ) : grouped.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No economic events in range.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead className="w-[110px]">Currency</TableHead>
                      <TableHead className="w-[120px]">Impact</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-[120px] text-right">Actual</TableHead>
                      <TableHead className="w-[120px] text-right">Forecast</TableHead>
                      <TableHead className="w-[120px] text-right">Previous</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped.map((g) => (
                      <React.Fragment key={g.dayKey}>
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 text-xs font-semibold">
                            {g.dayLabel}
                          </TableCell>
                        </TableRow>
                        {g.rows.map((e) => {
                          const timeLabel =
                            typeof e.startsAt === "number" && e.startsAt > 0
                              ? format(new Date(e.startsAt), "p")
                              : "All day";
                          const ccy = String(e.currency ?? "").trim().toUpperCase();
                          return (
                            <TableRow key={e._id}>
                              <TableCell className="text-xs text-muted-foreground">
                                {timeLabel}
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {ccy || "—"}
                              </TableCell>
                              <TableCell>
                                <ImpactBadge impact={e.impact} />
                              </TableCell>
                              <TableCell className="min-w-[320px]">
                                <Link
                                  href={`/news/${encodeURIComponent(e._id)}`}
                                  className="text-sm font-medium hover:underline hover:underline-offset-4"
                                >
                                  {e.title}
                                </Link>
                                {e.country ? (
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {e.country}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                —
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                —
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                —
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

