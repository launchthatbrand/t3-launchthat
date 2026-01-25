"use client";

import {
  BarChart3,
  DollarSign,
  Filter,
  PieChart,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { useActiveAccount } from "~/components/accounts/ActiveAccountProvider";
import { useDataMode } from "~/components/dataMode/DataModeProvider";

interface ReportSpecV1 {
  version: 1;
  rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
  fromMs?: number;
  toMs?: number;
  timezone: string;
  weekdays?: number[];
  symbols?: string[];
  direction?: ("long" | "short")[];
  includeUnrealized?: boolean;
}

interface ReportResult {
  headline: {
    realizedPnl: number;
    unrealizedPnl: number;
    netPnl: number;
    profitFactor: number;
    winRate: number;
    wins: number;
    losses: number;
    totalFees: number;
    avgHoldMs: number;
    closeEventCount: number;
  };
  byWeekday: { weekday: number; closeEventCount: number; pnl: number }[];
  byHour: { hour: number; closeEventCount: number; pnl: number }[];
  bySymbol: { symbol: string; closeEventCount: number; pnl: number }[];
  equityCurve: { date: string; pnl: number; cumulative: number }[];
  drawdown: { date: string; equity: number; peak: number; drawdown: number }[];
}

const weekdayLabels: { id: number; label: string }[] = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

const formatMoney = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
};

const formatPct = (n: number): string => {
  const v = Number.isFinite(n) ? n : 0;
  return `${Math.round(v * 100)}%`;
};

const formatDuration = (ms: number): string => {
  const v = Math.max(0, Math.floor(Number.isFinite(ms) ? ms : 0));
  const totalMinutes = Math.floor(v / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface MeApiResponseUser {
  email?: string;
  name?: string;
}

interface MeApiResponse {
  user: MeApiResponseUser | null;
}

const isMeApiResponse = (v: unknown): v is MeApiResponse => {
  if (!v || typeof v !== "object") return false;
  const maybe = v as { user?: unknown };
  if (!("user" in maybe)) return false;
  if (maybe.user === null) return true;
  if (!maybe.user || typeof maybe.user !== "object") return false;
  return true;
};

export default function AdminAnalyticsPage() {
  const dataMode = useDataMode();
  const activeAccount = useActiveAccount();
  const isLive = dataMode.effectiveMode === "live";
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [spec, setSpec] = React.useState<ReportSpecV1>(() => ({
    version: 1,
    rangePreset: "30d",
    timezone: defaultTimezone,
    weekdays: [],
    symbols: [],
    direction: [],
    includeUnrealized: true,
  }));

  const [saveOpen, setSaveOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");
  const [saveVisibility, setSaveVisibility] = React.useState<"private" | "link">("private");
  const [selectedSavedReportId, setSelectedSavedReportId] = React.useState<string>("");
  const [compareEnabled, setCompareEnabled] = React.useState(false);
  const [compareAId, setCompareAId] = React.useState<string>("");
  const [compareBId, setCompareBId] = React.useState<string>("");

  const createReport = useMutation(api.traderlaunchpad.mutations.createMyAnalyticsReport);
  const enableShare = useMutation(
    api.traderlaunchpad.mutations.enableMyAnalyticsReportShareLink,
  );
  const disableShare = useMutation(
    api.traderlaunchpad.mutations.disableMyAnalyticsReportShareLink,
  );
  const deleteReport = useMutation(api.traderlaunchpad.mutations.deleteMyAnalyticsReport);

  const liveResult = useQuery(
    api.traderlaunchpad.queries.runMyAnalyticsReport,
    shouldQuery && isLive
      ? { accountId: activeAccount.selected?.accountId, spec }
      : "skip",
  ) as unknown as ReportResult | undefined;

  const savedReports = useQuery(
    api.traderlaunchpad.queries.listMyAnalyticsReports,
    shouldQuery ? {} : "skip",
  ) as
    | {
      reportId: string;
      name: string;
      accountId?: string;
      visibility: "private" | "link";
      shareToken?: string;
      updatedAt: number;
      createdAt: number;
    }[]
    | undefined;

  const selectedSavedReport = useQuery(
    api.traderlaunchpad.queries.getMyAnalyticsReport,
    shouldQuery && selectedSavedReportId ? { reportId: selectedSavedReportId } : "skip",
  ) as unknown as
    | {
      reportId: string;
      name: string;
      accountId?: string;
      visibility: "private" | "link";
      shareToken?: string;
      spec: ReportSpecV1;
    }
    | null
    | undefined;

  const [shareUsername, setShareUsername] = React.useState<string>("me");

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const jsonUnknown: unknown = await res.json().catch(() => null);
        const user = isMeApiResponse(jsonUnknown) ? jsonUnknown.user : null;
        const email = typeof user?.email === "string" ? user.email : "";
        const name = typeof user?.name === "string" ? user.name : "";
        const fallback = email ? (email.split("@")[0] ?? "") : "";
        const raw = name || fallback || "me";
        const slug = slugify(raw) || "me";
        if (!cancelled) setShareUsername(slug);
      } catch {
        // ignore, keep "me"
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedSavedReport) return;
    setSpec(selectedSavedReport.spec);
    setSaveName(selectedSavedReport.name);
    setSaveVisibility(selectedSavedReport.visibility);
  }, [selectedSavedReport]);

  const shortlinkSettings = useQuery(
    api.shortlinks.queries.getPublicShortlinkSettings,
    shouldQuery ? {} : "skip",
  ) as { domain: string; enabled: boolean; codeLength: number } | undefined;

  const createShortlink = useMutation(api.shortlinks.mutations.createShortlink);
  const [shareUrl, setShareUrl] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token =
        selectedSavedReport && typeof selectedSavedReport.shareToken === "string"
          ? selectedSavedReport.shareToken
          : "";
      if (!token || !selectedSavedReportId) {
        if (!cancelled) setShareUrl("");
        return;
      }

      const path = `/u/${encodeURIComponent(shareUsername)}/a/${token}`;

      const domain = String(shortlinkSettings?.domain ?? "").trim();
      const enabled = Boolean(shortlinkSettings?.enabled);

      try {
        const resUnknown: unknown = await createShortlink({
          path,
          kind: "analyticsReport",
          targetId: selectedSavedReportId,
        });
        const res =
          resUnknown && typeof resUnknown === "object"
            ? (resUnknown as { url?: unknown; code?: unknown })
            : null;
        const code = typeof res?.code === "string" ? res.code : "";

        // Prefer explicit `url` from the server wrapper when configured.
        if (typeof res?.url === "string" && res.url.trim()) {
          if (!cancelled) setShareUrl(res.url);
          return;
        }

        // Local dev (or unconfigured domain): use same-origin redirect route.
        if (code) {
          const localUrl = `${window.location.origin}/s/${encodeURIComponent(code)}`;
          if (!cancelled) setShareUrl(localUrl);
          return;
        }

        // Configured domain but wrapper didn't return url (should be rare): best-effort.
        if (enabled && domain && code) {
          if (!cancelled) setShareUrl(`https://${domain}/s/${code}`);
          return;
        }

        if (!cancelled) setShareUrl(`${window.location.origin}${path}`);
      } catch {
        if (!cancelled) setShareUrl(`${window.location.origin}${path}`);
      }
    };

    if (shouldQuery) void run();
    return () => {
      cancelled = true;
    };
  }, [createShortlink, selectedSavedReport, selectedSavedReportId, shareUsername, shortlinkSettings?.domain, shortlinkSettings?.enabled, shouldQuery]);

  const compareAReport = useQuery(
    api.traderlaunchpad.queries.getMyAnalyticsReport,
    shouldQuery && compareEnabled && compareAId ? { reportId: compareAId } : "skip",
  ) as unknown as { spec?: ReportSpecV1; name?: string; accountId?: string } | null | undefined;

  const compareBReport = useQuery(
    api.traderlaunchpad.queries.getMyAnalyticsReport,
    shouldQuery && compareEnabled && compareBId ? { reportId: compareBId } : "skip",
  ) as unknown as { spec?: ReportSpecV1; name?: string; accountId?: string } | null | undefined;

  const compareAResult = useQuery(
    api.traderlaunchpad.queries.runMyAnalyticsReport,
    shouldQuery && compareEnabled && isLive && compareAReport?.spec
      ? {
        accountId: compareAReport.accountId ?? activeAccount.selected?.accountId,
        spec: compareAReport.spec,
      }
      : "skip",
  ) as unknown as ReportResult | undefined;

  const compareBResult = useQuery(
    api.traderlaunchpad.queries.runMyAnalyticsReport,
    shouldQuery && compareEnabled && isLive && compareBReport?.spec
      ? {
        accountId: compareBReport.accountId ?? activeAccount.selected?.accountId,
        spec: compareBReport.spec,
      }
      : "skip",
  ) as unknown as ReportResult | undefined;

  const netDelta =
    (compareAResult?.headline.netPnl ?? 0) - (compareBResult?.headline.netPnl ?? 0);

  // Minimal demo: show empty-ish placeholders but still responsive to filters.
  const demoResult = React.useMemo<ReportResult>(() => {
    const empty: ReportResult = {
      headline: {
        realizedPnl: 0,
        unrealizedPnl: 0,
        netPnl: 0,
        profitFactor: 0,
        winRate: 0,
        wins: 0,
        losses: 0,
        totalFees: 0,
        avgHoldMs: 0,
        closeEventCount: 0,
      },
      byWeekday: [],
      byHour: [],
      bySymbol: [],
      equityCurve: [],
      drawdown: [],
    };
    return empty;
  }, []);

  const result = isLive ? liveResult : demoResult;

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into your trading performance and metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={spec.rangePreset}
            onValueChange={(v) =>
              setSpec((s) => ({
                ...s,
                rangePreset:
                  v === "7d" || v === "30d" || v === "90d" || v === "ytd" || v === "all"
                    ? v
                    : "30d",
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Filters">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Days of week</div>
                  <div className="grid grid-cols-4 gap-2">
                    {weekdayLabels.map((w) => {
                      const checked = (spec.weekdays ?? []).includes(w.id);
                      return (
                        <label
                          key={w.id}
                          className="flex items-center gap-2 rounded-md border p-2 text-xs"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              setSpec((s) => {
                                const cur = new Set<number>(s.weekdays ?? []);
                                if (next) cur.add(w.id);
                                else cur.delete(w.id);
                                return { ...s, weekdays: Array.from(cur).sort((a, b) => a - b) };
                              });
                            }}
                          />
                          {w.label}
                        </label>
                      );
                    })}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Leave empty for all days.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbols">Symbols</Label>
                  <Input
                    id="symbols"
                    placeholder="BTCUSD, EURUSD"
                    value={(spec.symbols ?? []).join(", ")}
                    onChange={(e) =>
                      setSpec((s) => ({
                        ...s,
                        symbols: e.target.value
                          .split(",")
                          .map((x) => x.trim().toUpperCase())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">Include unrealized</div>
                    <div className="text-muted-foreground text-xs">
                      Adds current open PnL snapshot to net.
                    </div>
                  </div>
                  <Switch
                    checked={spec.includeUnrealized !== false}
                    onCheckedChange={(checked) =>
                      setSpec((s) => ({ ...s, includeUnrealized: checked }))
                    }
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={selectedSavedReportId || "current"}
            onValueChange={(v) => setSelectedSavedReportId(v === "current" ? "" : v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Saved reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current (unsaved)</SelectItem>
              {(savedReports ?? []).map((r) => (
                <SelectItem key={r.reportId} value={r.reportId}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isLive || !shouldQuery}>Save report</Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Save analytics report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Name</Label>
                  <Input
                    id="reportName"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Tue/Thu only"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={saveVisibility}
                    onValueChange={(v) =>
                      setSaveVisibility(v === "link" ? "link" : "private")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="link">Shareable by link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={async () => {
                    const name = saveName.trim() || "Untitled report";
                    const outUnknown: unknown = await createReport({
                      name,
                      accountId: activeAccount.selected?.accountId,
                      visibility: saveVisibility,
                      spec,
                    });
                    const out =
                      outUnknown && typeof outUnknown === "object"
                        ? (outUnknown as { reportId?: unknown })
                        : null;
                    const reportId = typeof out?.reportId === "string" ? out.reportId : "";
                    if (reportId) setSelectedSavedReportId(reportId);
                    setSaveOpen(false);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Compare</span>
            <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
          </div>
        </div>
      </div>

      {compareEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Compare reports</CardTitle>
            <CardDescription>Pick two saved reports and compare results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Select value={compareAId} onValueChange={setCompareAId}>
                <SelectTrigger>
                  <SelectValue placeholder="Report A" />
                </SelectTrigger>
                <SelectContent>
                  {(savedReports ?? []).map((r) => (
                    <SelectItem key={r.reportId} value={r.reportId}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareBId} onValueChange={setCompareBId}>
                <SelectTrigger>
                  <SelectValue placeholder="Report B" />
                </SelectTrigger>
                <SelectContent>
                  {(savedReports ?? []).map((r) => (
                    <SelectItem key={r.reportId} value={r.reportId}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Net PnL Δ (A - B)</div>
                <div className={cn("mt-1 text-lg font-semibold", netDelta >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatMoney(netDelta)}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border">
              <div className="grid grid-cols-4 gap-0 border-b bg-muted/40 text-xs">
                <div className="p-2 font-medium">Metric</div>
                <div className="p-2 font-medium">A</div>
                <div className="p-2 font-medium">B</div>
                <div className="p-2 font-medium">Δ</div>
              </div>
              {[
                {
                  label: "Net PnL",
                  a: compareAResult?.headline.netPnl ?? 0,
                  b: compareBResult?.headline.netPnl ?? 0,
                  fmt: (n: number) => formatMoney(n),
                },
                {
                  label: "Win rate",
                  a: compareAResult?.headline.winRate ?? 0,
                  b: compareBResult?.headline.winRate ?? 0,
                  fmt: (n: number) => formatPct(n),
                },
                {
                  label: "Profit factor",
                  a: compareAResult?.headline.profitFactor ?? 0,
                  b: compareBResult?.headline.profitFactor ?? 0,
                  fmt: (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "—"),
                },
                {
                  label: "Fees",
                  a: compareAResult?.headline.totalFees ?? 0,
                  b: compareBResult?.headline.totalFees ?? 0,
                  fmt: (n: number) => formatMoney(n),
                },
              ].map((row) => {
                const delta = row.a - row.b;
                return (
                  <div key={row.label} className="grid grid-cols-4 text-sm">
                    <div className="p-2 text-muted-foreground">{row.label}</div>
                    <div className="p-2 tabular-nums">{row.fmt(row.a)}</div>
                    <div className="p-2 tabular-nums">{row.fmt(row.b)}</div>
                    <div
                      className={cn(
                        "p-2 tabular-nums",
                        row.label === "Win rate" || row.label === "Profit factor"
                          ? delta >= 0
                            ? "text-emerald-500"
                            : "text-red-500"
                          : delta >= 0
                            ? "text-emerald-500"
                            : "text-red-500",
                      )}
                    >
                      {row.fmt(delta)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedSavedReportId && selectedSavedReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Saved report</CardTitle>
            <CardDescription>
              {selectedSavedReport.name} •{" "}
              {selectedSavedReport.visibility === "link" ? "Shareable link" : "Private"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={selectedSavedReport.visibility}
                  onValueChange={async (v) => {
                    if (!selectedSavedReportId) return;
                    if (v === "link") {
                      await enableShare({ reportId: selectedSavedReportId });
                    } else {
                      await disableShare({ reportId: selectedSavedReportId });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="link">Shareable by link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Share link</Label>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl || "—"} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!shareUrl}
                    onClick={async () => {
                      if (!shareUrl) return;
                      await navigator.clipboard.writeText(shareUrl);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-muted-foreground text-xs">
                  Shortlinks are generated when sharing is enabled. Configure the short domain in{" "}
                  <span className="font-medium text-foreground">/platform/settings/shortlinks</span>.
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-muted-foreground text-sm">
                Report runs on account{" "}
                <span className="font-medium text-foreground">
                  {selectedSavedReport.accountId ?? activeAccount.selected?.accountId ?? "—"}
                </span>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  if (!selectedSavedReportId) return;
                  await deleteReport({ reportId: selectedSavedReportId });
                  setSelectedSavedReportId("");
                }}
              >
                Delete report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Net P&L
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                (result?.headline.netPnl ?? 0) >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {formatMoney(result?.headline.netPnl ?? 0)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Realized {formatMoney(result?.headline.realizedPnl ?? 0)} • Unrealized{" "}
              {formatMoney(result?.headline.unrealizedPnl ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Profit Factor
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number.isFinite(result?.headline.profitFactor ?? 0)
                ? (result?.headline.profitFactor ?? 0).toFixed(2)
                : "—"}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Gross Win / Gross Loss
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Win Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPct(result?.headline.winRate ?? 0)}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {(result?.headline.wins ?? 0).toLocaleString()} Wins /{" "}
              {(result?.headline.losses ?? 0).toLocaleString()} Losses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Avg Hold
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(result?.headline.avgHoldMs ?? 0)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Across {(result?.headline.closeEventCount ?? 0).toLocaleString()} close events
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Perf</TabsTrigger>
        </TabsList>

        <TabsContent value="equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Growth</CardTitle>
              <CardDescription>
                Cumulative profit and loss over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(result?.equityCurve ?? []).slice(-20).map((p) => (
                  <div key={p.date} className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">{p.date}</div>
                    <div className="tabular-nums">{formatMoney(p.cumulative)}</div>
                  </div>
                ))}
                {(result?.equityCurve ?? []).length === 0 ? (
                  <div className="text-muted-foreground text-sm">No data in range.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="drawdown">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Analysis</CardTitle>
              <CardDescription>
                Visualize risk and recovery periods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(result?.drawdown ?? []).slice(-20).map((p) => (
                <div key={p.date} className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">{p.date}</div>
                  <div className="tabular-nums">{formatMoney(p.drawdown)}</div>
                </div>
              ))}
              {(result?.drawdown ?? []).length === 0 ? (
                <div className="text-muted-foreground text-sm">No data in range.</div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance</CardTitle>
              <CardDescription>
                Best trading hours based on PnL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(result?.byHour ?? []).map((h) => (
                <div key={h.hour} className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">{String(h.hour).padStart(2, "0")}:00</div>
                  <div className="tabular-nums">{formatMoney(h.pnl)}</div>
                </div>
              ))}
              {(result?.byHour ?? []).length === 0 ? (
                <div className="text-muted-foreground text-sm">No data in range.</div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Assets</CardTitle>
            <CardDescription>Where you make the most money.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(result?.bySymbol ?? []).slice(0, 8).map((row, i) => (
              <div key={`${row.symbol}-${i}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">
                    {i + 1}
                  </div>
                  <span className="font-medium">{row.symbol}</span>
                </div>
                <div className="text-right">
                  <div className={cn("font-medium", row.pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {formatMoney(row.pnl)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {row.closeEventCount} closes
                  </div>
                </div>
              </div>
            ))}
            {(result?.bySymbol ?? []).length === 0 ? (
              <div className="text-muted-foreground text-sm">No data in range.</div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
            <CardDescription>Average PnL per trade outcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weekday breakdown</span>
                <span className="text-muted-foreground text-xs">{spec.timezone}</span>
              </div>
              <div className="space-y-1">
                {weekdayLabels.map((w) => {
                  const row = (result?.byWeekday ?? []).find((x) => x.weekday === w.id);
                  const pnl = row?.pnl ?? 0;
                  return (
                    <div key={w.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{w.label}</span>
                      <span className={cn("tabular-nums", pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {formatMoney(pnl)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Largest Win</span>
              <span className="font-bold text-emerald-500">—</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Largest Loss</span>
              <span className="font-bold text-red-500">—</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLive ? (
        <div className="text-muted-foreground text-sm">
          Demo mode: analytics will populate once live data is enabled and a broker is connected.
        </div>
      ) : null}
    </div>
  );
}
