"use client";

import * as React from "react";

import { ArrowLeft, ArrowUpRight, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  FeatureAccessAlert,
  isFeatureEnabled,
  useGlobalPermissions,
} from "~/components/access/FeatureAccessGate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useAction, useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { NotesSection } from "~/components/admin/NotesSection";
import { Skeleton } from "@acme/ui/skeleton";
import { TradingChartReal } from "~/components/charts/TradingChartReal";
import type { TradingTimeframe } from "~/components/charts/TradingChartMock";
import { api } from "@convex-config/_generated/api";
import { cn } from "@acme/ui";
import { toast } from "@acme/ui";
import { useParams } from "next/navigation";

const toDateLabel = (tsMs: number): string => {
  const d = new Date(tsMs);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const toChartTimeframe = (tf: string): TradingTimeframe => {
  const v = String(tf ?? "").toLowerCase();
  if (v === "m5" || v === "5m") return "5m";
  if (v === "m15" || v === "15m") return "15m";
  if (v === "h1" || v === "1h") return "1h";
  if (v === "h4" || v === "4h") return "4h";
  if (v === "d1" || v === "1d") return "1d";
  return "15m";
};

const chartTimeframes: TradingTimeframe[] = ["15m", "1h", "4h"];

const resolutionForTimeframe = (timeframe: TradingTimeframe) => {
  switch (timeframe) {
    case "1h":
      return "1H";
    case "4h":
      return "4H";
    case "15m":
    default:
      return "15m";
  }
};

const lookbackDaysForTimeframe = (timeframe: TradingTimeframe) => {
  switch (timeframe) {
    case "4h":
      return 30;
    case "1h":
      return 14;
    case "15m":
    default:
      return 7;
  }
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
  publicUsername?: string;
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

interface TradeIdeaBar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface TradeIdeaBarsResult {
  ok: boolean;
  tradeIdeaGroupId: string;
  symbol?: string;
  sourceKey?: string;
  resolution: string;
  bars: TradeIdeaBar[];
  error?: string;
}

interface TradeIdeaGroupSummary {
  _id: string;
  tradeIdeaId?: string;
  symbol?: string;
}

function TradeIdeaBrokerChart(props: {
  tradeIdeaGroupId?: string;
  symbol: string;
  defaultTimeframe: TradingTimeframe;
}) {
  const [timeframe, setTimeframe] = React.useState<TradingTimeframe>(
    props.defaultTimeframe,
  );
  const resolution = resolutionForTimeframe(timeframe);
  const lookbackDays = lookbackDaysForTimeframe(timeframe);

  React.useEffect(() => {
    setTimeframe(props.defaultTimeframe);
  }, [props.defaultTimeframe]);

  const getBars = useAction(api.traderlaunchpad.queries.getMyTradeIdeaBars);
  const [data, setData] = React.useState<TradeIdeaBarsResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!props.tradeIdeaGroupId) {
        setData(null);
        setLoadError(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = (await getBars({
          tradeIdeaGroupId: props.tradeIdeaGroupId,
          resolution,
          lookbackDays,
        })) as TradeIdeaBarsResult;
        if (cancelled) return;
        setData(res);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
        setData(null);
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [getBars, lookbackDays, props.tradeIdeaGroupId, resolution]);

  const bars = Array.isArray(data?.bars) ? data.bars : [];
  const sourceKey = typeof data?.sourceKey === "string" ? data.sourceKey : "";
  const error =
    loadError ?? (data && data.ok === false ? data.error ?? "No bars available." : null);

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
      <CardHeader className="border-b border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Price Action (Broker)</CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {props.symbol}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {chartTimeframes.map((tf) => {
              const isActive = tf === timeframe;
              return (
                <Badge
                  key={tf}
                  asChild
                  variant="outline"
                  className={cn(
                    "border-white/10 bg-background/20 transition-colors",
                    isActive
                      ? "bg-white/10 text-white"
                      : "cursor-pointer text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <button type="button" onClick={() => setTimeframe(tf)}>
                    {tf}
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
        {sourceKey ? (
          <div className="mt-2 text-xs text-muted-foreground">
            Source: <span className="font-mono text-white/70">{sourceKey}</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="bg-black/40 p-2">
        {!props.tradeIdeaGroupId ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-white/60">
            No broker connection linked to this trade idea yet.
          </div>
        ) : isLoading ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-white/60">
            Loading price data…
          </div>
        ) : error ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-white/70">
            {error}
          </div>
        ) : bars.length > 0 ? (
          <TradingChartReal bars={bars} height={360} className="w-full" />
        ) : (
          <div className="flex h-[360px] items-center justify-center text-sm text-white/60">
            No broker bars available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminTradeIdeaDetailPage() {
  const params = useParams();
  const rawId =
    typeof (params as Record<string, unknown>).tradeIdeaId === "string"
      ? String((params as Record<string, unknown>).tradeIdeaId)
      : "";
  const tradeIdeaId = rawId ? decodeURIComponent(rawId) : "";

  const { permissions, isLoading, isAuthenticated } = useGlobalPermissions();
  const canAccess = Boolean(permissions && isFeatureEnabled(permissions, "strategies"));
  const shouldQuery = isAuthenticated && !isLoading && canAccess && Boolean(tradeIdeaId);

  const setSharing = useMutation(api.traderlaunchpad.mutations.setMyTradeIdeaSharing);
  const createShortlink = useMutation(api.shortlinks.mutations.createShortlink);

  const group = useQuery(
    api.traderlaunchpad.queries.getMyTradeIdeaById,
    shouldQuery ? { tradeIdeaGroupId: tradeIdeaId } : "skip",
  ) as TradeIdeaGroupSummary | null | undefined;

  const detail = useQuery(
    api.traderlaunchpad.queries.getMyTradeIdeaDetailByAnyId,
    shouldQuery ? { id: tradeIdeaId, positionsLimit: 200 } : "skip",
  ) as
    | {
      tradeIdeaId: string;
      symbol: string;
      bias: "long" | "short" | "neutral";
      status: "active" | "closed";
      timeframe: string;
      timeframeLabel?: string;
      thesis?: string;
      tags?: string[];
      visibility: "private" | "link" | "public";
      shareToken?: string;
      shareEnabledAt?: number;
      expiresAt?: number;
      positions: {
        tradeIdeaGroupId: string;
        symbol: string;
        direction: "long" | "short";
        status: "open" | "closed";
        openedAt: number;
        closedAt?: number;
        realizedPnl?: number;
        fees?: number;
        netQty: number;
      }[];
    }
    | null
    | undefined;

  const [shareUsername, setShareUsername] = React.useState<string>("me");
  const [shareUrl, setShareUrl] = React.useState<string>("");
  const [shareBusy, setShareBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const jsonUnknown: unknown = await res.json().catch(() => null);
        const user = isMeApiResponse(jsonUnknown) ? jsonUnknown.user : null;
        const publicUsername =
          typeof user?.publicUsername === "string" ? user.publicUsername.trim() : "";
        const email = typeof user?.email === "string" ? user.email : "";
        const name = typeof user?.name === "string" ? user.name : "";
        const fallback = email ? (email.split("@")[0] ?? "") : "";
        const raw = publicUsername || name || fallback;
        const next = raw ? slugify(raw) : "";
        if (!cancelled) setShareUsername(next || "me");
      } catch {
        // ignore
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const positions = React.useMemo(
    () => (detail && Array.isArray(detail.positions) ? detail.positions : []),
    [detail],
  );
  const resolvedTradeIdeaId = React.useMemo(() => {
    if (detail && typeof detail.tradeIdeaId === "string" && detail.tradeIdeaId) {
      return detail.tradeIdeaId;
    }
    if (group && typeof group.tradeIdeaId === "string" && group.tradeIdeaId) {
      return group.tradeIdeaId;
    }
    return tradeIdeaId;
  }, [detail, group, tradeIdeaId]);
  const primaryGroupId = React.useMemo(
    () =>
      positions.length
        ? positions[0]?.tradeIdeaGroupId
        : group && typeof group._id === "string"
          ? group._id
          : undefined,
    [group, positions],
  );
  const openedAt = React.useMemo(
    () => (positions.length ? Math.min(...positions.map((p) => p.openedAt)) : Date.now()),
    [positions],
  );
  const closedAt = React.useMemo(() => {
    if (!positions.length) return null;
    if (!positions.every((p) => p.status === "closed")) return null;
    return Math.max(...positions.map((p) => p.closedAt ?? p.openedAt));
  }, [positions]);
  const netPnl = React.useMemo(
    () => positions.reduce((acc, p) => acc + (p.realizedPnl ?? 0), 0),
    [positions],
  );

  const targetIdForShortlink = React.useMemo(
    () =>
      detail && typeof detail.tradeIdeaId === "string"
        ? detail.tradeIdeaId
        : resolvedTradeIdeaId,
    [detail, resolvedTradeIdeaId],
  );

  const ensureShareUrl = React.useCallback(
    async (args: { shareToken: string; visibility: "link" | "public" }) => {
      if (!args.shareToken) return "";

      const username = shareUsername.trim();
      if (!username || username === "me") {
        toast.error("Unable to resolve your public username for sharing.");
        return "";
      }

      const path = `/u/${encodeURIComponent(username)}/tradeidea/${encodeURIComponent(
        targetIdForShortlink,
      )}?code=${encodeURIComponent(args.shareToken)}`;
      const resUnknown: unknown = await createShortlink({
        path,
        kind: "tradeIdea",
        targetId: targetIdForShortlink,
      });
      const out =
        resUnknown && typeof resUnknown === "object"
          ? (resUnknown as { code?: unknown; url?: unknown })
          : null;
      const code = typeof out?.code === "string" ? out.code : "";
      const url = typeof out?.url === "string" ? out.url : "";
      if (url) return url;
      if (!code) return "";
      return `${window.location.origin}/s/${code}`;
    },
    [createShortlink, shareUsername, targetIdForShortlink],
  );

  const publicUrl = React.useMemo(() => {
    const username = shareUsername.trim();
    if (!username || username === "me") return "";
    const target = targetIdForShortlink.trim();
    if (!target) return "";
    return `${window.location.origin}/u/${encodeURIComponent(username)}/tradeidea/${encodeURIComponent(target)}`;
  }, [shareUsername, targetIdForShortlink]);

  const directShareUrl = React.useMemo(() => {
    if (detail?.visibility === "private") return "";
    const token = typeof detail?.shareToken === "string" ? detail.shareToken.trim() : "";
    if (!publicUrl || !token) return "";
    return `${publicUrl}?code=${encodeURIComponent(token)}`;
  }, [detail?.shareToken, detail?.visibility, publicUrl]);

  if (!canAccess && !isLoading) {
    return (
      <FeatureAccessAlert description="You do not have access to Trade Ideas." />
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detail === undefined) {
    return (
      <div className="container py-8 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!detail) {
    return <div className="container py-8 text-sm text-white/60">Idea not found.</div>;
  }

  return (
    <div className="space-y-6 duration-500 pb-10 text-white">
      {/* Header (match order page style) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/tradeideas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{detail.symbol}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {detail.tradeIdeaId}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 px-1.5 text-[10px]",
                  detail.bias === "long"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : detail.bias === "short"
                      ? "border-red-500/20 bg-red-500/10 text-red-500"
                      : "border-white/10 bg-white/5 text-white/70",
                )}
              >
                {detail.bias === "long" ? "Long" : detail.bias === "short" ? "Short" : "Neutral"}
              </Badge>
              {detail.status === "active" ? (
                <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-0">
                  Active thesis
                </Badge>
              ) : (
                <Badge className="bg-white/5 text-white/60">Closed</Badge>
              )}
              <Badge variant="secondary" className="bg-white/5 text-white/60">
                {detail.visibility === "public"
                  ? "Public"
                  : detail.visibility === "link"
                    ? "Sharable"
                    : "Private"}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              <span>{toDateLabel(openedAt)}</span>
              <span className="text-muted-foreground/40">•</span>
              <Clock className="h-3.5 w-3.5" />
              <span>{detail.timeframeLabel ?? detail.timeframe}</span>
              {typeof closedAt === "number" ? (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>Closed {toDateLabel(closedAt)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={shareBusy}
            onClick={async () => {
              setShareBusy(true);
              try {
                const res = await setSharing({ tradeIdeaId: detail.tradeIdeaId, visibility: "link" });
                const token = typeof (res as any)?.shareToken === "string" ? String((res as any).shareToken) : "";
                const url = await ensureShareUrl({ shareToken: token, visibility: "link" });
                setShareUrl(url);
                if (url) {
                  await navigator.clipboard.writeText(url);
                  toast.success("Share link copied.");
                } else {
                  toast.error("Failed to generate share link.");
                }
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to enable sharing.");
              } finally {
                setShareBusy(false);
              }
            }}
          >
            {shareBusy ? "Sharing…" : "Share"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key Stats Cards (like order page) */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Symbol</div>
                <div className="mt-1 text-lg font-bold">{detail.symbol}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Bias</div>
                <div
                  className={cn(
                    "mt-1 text-lg font-bold",
                    detail.bias === "long"
                      ? "text-emerald-500"
                      : detail.bias === "short"
                        ? "text-rose-500"
                        : "text-white/80",
                  )}
                >
                  {detail.bias === "long" ? "Long" : detail.bias === "short" ? "Short" : "Neutral"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Positions</div>
                <div className="mt-1 text-lg font-bold">{detail.positions.length}</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/3 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-muted-foreground text-xs font-medium">Net P&amp;L</div>
                <div
                  className={cn(
                    "mt-1 text-lg font-bold",
                    netPnl >= 0 ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {netPnl >= 0 ? "+" : "-"}${Math.abs(netPnl).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <TradeIdeaBrokerChart
            tradeIdeaGroupId={primaryGroupId}
            symbol={detail.symbol}
            defaultTimeframe={toChartTimeframe(detail.timeframe)}
          />

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-base">Thesis</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm text-white/80">
              {detail.thesis ?? <span className="text-white/50">No thesis text yet.</span>}
              {Array.isArray(detail.tags) && detail.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-white/5 text-white/60">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select
                  value={detail.visibility}
                  onValueChange={async (v) => {
                    const next =
                      v === "public" ? "public" : v === "link" ? "link" : "private";
                    setShareBusy(true);
                    try {
                      const res = await setSharing({
                        tradeIdeaId: detail.tradeIdeaId,
                        visibility: next,
                      });
                      const token =
                        typeof (res as any)?.shareToken === "string"
                          ? String((res as any).shareToken)
                          : "";
                      if (next === "private") {
                        setShareUrl("");
                        toast.success("Set to private.");
                        return;
                      }
                      const url = await ensureShareUrl({ shareToken: token, visibility: next });
                      setShareUrl(url);
                      toast.success("Sharing enabled.");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to update visibility.");
                    } finally {
                      setShareBusy(false);
                    }
                  }}
                >
                  <SelectTrigger disabled={shareBusy}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="link">Sharable by link</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-white/50">
                  Control defaults in <span className="font-medium text-white">Settings → Visibility</span>.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Public link</Label>
                <div className="flex items-center gap-2">
                  <Input value={publicUrl || "—"} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!publicUrl}
                    onClick={async () => {
                      if (!publicUrl) return;
                      await navigator.clipboard.writeText(publicUrl);
                      toast.success("Copied.");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-white/50">
                  Works only when visibility is <span className="font-medium text-white">Public</span>.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shareable link (code)</Label>
                <div className="flex items-center gap-2">
                  <Input value={directShareUrl || "—"} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!directShareUrl}
                    onClick={async () => {
                      if (!directShareUrl) return;
                      await navigator.clipboard.writeText(directShareUrl);
                      toast.success("Copied.");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-white/50">
                  Same canonical route, gated by <span className="font-medium text-white">?code=</span>.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shortlink</Label>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl || "—"} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!shareUrl}
                    onClick={async () => {
                      if (!shareUrl) return;
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Copied.");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-white/50">
                  Shortlinks resolve via <span className="font-medium text-white">/s/&lt;code&gt;</span>.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="border-b border-white/10 p-4">
              <CardTitle className="text-base">Trades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {detail.positions.length === 0 ? (
                <div className="p-6 text-sm text-white/60">No positions attached yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {detail.positions.map((p) => (
                    <div key={p.tradeIdeaGroupId} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-white">{p.symbol}</div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px]",
                              p.direction === "long"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                : "border-red-500/20 bg-red-500/10 text-red-500",
                            )}
                          >
                            {p.direction === "long" ? "Long" : "Short"}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/5 text-white/60">
                            {p.status === "open" ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          Opened {toDateLabel(p.openedAt)}
                          {typeof p.closedAt === "number" ? ` • Closed ${toDateLabel(p.closedAt)}` : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <div className="text-white/50">P&amp;L</div>
                          <div className={cn((p.realizedPnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200")}>
                            {(p.realizedPnl ?? 0) >= 0 ? "+" : "-"}${Math.abs(p.realizedPnl ?? 0).toFixed(2)}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-white/10" asChild>
                          <Link href={`/admin/tradeideas/${encodeURIComponent(p.tradeIdeaGroupId)}`}>
                            View <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <NotesSection
            entityId={detail.tradeIdeaId}
            entityLabel={`Trade Idea ${detail.symbol}`}
            className="border-white/10 bg-white/3 backdrop-blur-md"
          />
        </div>
      </div>
    </div>
  );
}

