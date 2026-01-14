"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/no-unnecessary-condition,
  react-hooks/exhaustive-deps
*/
import React from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";

import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

type TradeLockerEnv = "demo" | "live";

const formatMs = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${String(r).padStart(2, "0")}s`;
};

const formatAge = (ts: number): string => {
  if (!ts || ts <= 0) return "—";
  const diff = Date.now() - ts;
  if (diff < 10_000) return "just now";
  return `${formatMs(diff)} ago`;
};

const formatMoney = (value: unknown): string => {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const pickNumber = (obj: any, keys: string[]): number | null => {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = (obj as any)[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
};

interface TradePositionRow extends Record<string, unknown> {
  _id: string;
  symbol?: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  openedAt?: number;
  qty?: number;
  avgPrice?: number;
  updatedAt?: number;
}

interface TradeOrderRow extends Record<string, unknown> {
  _id: string;
  externalOrderId: string;
  symbol?: string;
  instrumentId?: string;
  side?: "buy" | "sell";
  status?: string;
  createdAt?: number;
  updatedAt?: number;
}

const formatDateTime = (ms: unknown): string => {
  const n =
    typeof ms === "number" ? ms : typeof ms === "string" ? Number(ms) : NaN;
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Date(n).toLocaleString();
};

export const TraderLaunchpadAccountTab = () => {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  // Import Convex generated api as `any` to avoid TS "type instantiation is excessively deep"
  // issues in some client builds when the generated type graph gets too large.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tlApi = require("@/convex/_generated/api") as any;
  const tlQueries = tlApi.api.plugins.traderlaunchpad.queries as any;
  const tlActions = tlApi.api.plugins.traderlaunchpad.actions as any;

  const connectionData = useQuery(
    tlQueries.getMyTradeLockerConnection,
    organizationId ? { organizationId } : "skip",
  ) as any;

  const connection = connectionData?.connection ?? connectionData ?? null;
  const polling = connectionData?.polling ?? null;

  const positionsSectionRef = React.useRef<HTMLDivElement | null>(null);
  const ordersSectionRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const lastSyncAtMs = Number(
    polling?.lastSyncAt ?? connection?.lastSyncAt ?? 0,
  );
  const syncStatusText = polling?.isSyncing
    ? "Syncing now"
    : polling?.nextSyncAt
      ? Number(polling.nextSyncAt) - now > 0
        ? `Syncing again in ${formatMs(Number(polling.nextSyncAt) - now)}`
        : `Sync overdue by ${formatMs(now - Number(polling.nextSyncAt))}`
      : "—";

  const startConnect = useAction(tlActions.startTradeLockerConnect);
  const finishConnect = useAction(tlActions.connectTradeLocker);
  const disconnect = useAction(tlActions.disconnectTradeLocker);
  const syncNow = useAction(tlActions.syncMyTradeLockerNow);

  const [environment, setEnvironment] = React.useState<TradeLockerEnv>("demo");
  const [server, setServer] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [connectDraft, setConnectDraft] = React.useState<{
    draftId: string;
    accounts: any[];
  } | null>(null);
  const [selectedAccountKey, setSelectedAccountKey] =
    React.useState<string>("");
  const [isConnecting, setIsConnecting] = React.useState(false);

  const orders = useQuery(
    tlQueries.listMyTradeLockerOrders,
    organizationId ? { organizationId, limit: 200 } : "skip",
  ) as any[] | undefined;

  const ordersHistory = useQuery(
    tlQueries.listMyTradeLockerOrdersHistory,
    organizationId ? { organizationId, limit: 200 } : "skip",
  ) as any[] | undefined;

  const positions = useQuery(
    tlQueries.listMyTradeLockerPositions,
    organizationId ? { organizationId, limit: 200 } : "skip",
  ) as any[] | undefined;

  const accountState = useQuery(
    tlQueries.getMyTradeLockerAccountState,
    organizationId ? { organizationId } : "skip",
  ) as any;

  const parsedAccountDetails =
    accountState?.raw?.parsedAccountDetails ??
    accountState?.raw?.parsed ??
    null;

  const accounts = Array.isArray(connectDraft?.accounts)
    ? connectDraft?.accounts
    : [];

  const selectedAccount = React.useMemo(() => {
    if (!selectedAccountKey) return null;
    const idx = Number(selectedAccountKey);
    if (!Number.isFinite(idx)) return null;
    return accounts[idx] ?? null;
  }, [accounts, selectedAccountKey]);

  const handleStartConnect = async () => {
    if (!organizationId) return;
    try {
      setIsConnecting(true);
      const result = await startConnect({
        organizationId,
        environment,
        server: server.trim(),
        email: email.trim(),
        password,
      });
      setConnectDraft(result);
      setPassword("");
      toast.success("Authenticated. Pick an account.");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFinishConnect = async () => {
    if (!organizationId) return;
    if (!connectDraft?.draftId) return;
    if (!selectedAccount) {
      toast.error("Select an account");
      return;
    }
    try {
      setIsConnecting(true);
      const selectedAccountId = String(
        selectedAccount.accountId ??
          selectedAccount.id ??
          selectedAccount._id ??
          "",
      );
      const selectedAccNum = Number(
        selectedAccount.accNum ??
          selectedAccount.acc_num ??
          selectedAccount.accountNumber ??
          0,
      );
      await finishConnect({
        organizationId,
        draftId: connectDraft.draftId,
        selectedAccountId,
        selectedAccNum,
      });
      setConnectDraft(null);
      setSelectedAccountKey("");
      toast.success("TradeLocker connected");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save connection");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="ideas">Trade Ideas</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open trades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!connection ? (
                  <div className="text-muted-foreground text-sm">
                    Connect to view.
                  </div>
                ) : positions === undefined ? (
                  <div className="text-muted-foreground text-sm">Loading…</div>
                ) : (
                  <>
                    <div className="text-2xl font-semibold">
                      {String((positions ?? []).length)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Last synced {formatAge(lastSyncAtMs)} • {syncStatusText}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => scrollToSection(positionsSectionRef)}
                      disabled={!positions || positions.length === 0}
                    >
                      View All Open Positions
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!connection ? (
                <div className="text-muted-foreground">
                  Connect TradeLocker to see your account dashboard.
                </div>
              ) : !accountState ? (
                <div className="text-muted-foreground">
                  No account state yet. Click Sync now in Settings.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs">
                        Account size
                      </div>
                      <div className="text-lg font-semibold">
                        {formatMoney(
                          pickNumber(parsedAccountDetails, [
                            "balance",
                            "equity",
                            "accountSize",
                            "account_size",
                            "initialBalance",
                            "initial_balance",
                          ]),
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs">
                        Available funds
                      </div>
                      <div className="text-lg font-semibold">
                        {formatMoney(
                          pickNumber(parsedAccountDetails, [
                            "availableFunds",
                            "available_funds",
                            "freeMargin",
                            "free_margin",
                            "available",
                          ]),
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-muted-foreground text-xs">PnL</div>
                      <div className="text-lg font-semibold">
                        {formatMoney(
                          pickNumber(parsedAccountDetails, [
                            "pnl",
                            "PnL",
                            "unrealizedPnl",
                            "unrealized_pnl",
                            "realizedPnl",
                            "realized_pnl",
                            "profit",
                          ]),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-muted-foreground text-xs">
                    Updated{" "}
                    {typeof accountState.updatedAt === "number"
                      ? new Date(accountState.updatedAt).toLocaleString()
                      : "—"}
                  </div>

                  {parsedAccountDetails ? (
                    <details className="rounded-md border p-3">
                      <summary className="text-muted-foreground cursor-pointer text-xs font-medium select-none">
                        View raw account details
                      </summary>
                      <pre className="pt-3 text-xs wrap-break-word whitespace-pre-wrap">
                        {JSON.stringify(parsedAccountDetails, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      Account details columns not mapped yet (still storing raw
                      state).
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Positions preview + full list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Open Positions</CardTitle>
              <Button
                variant="secondary"
                onClick={() => scrollToSection(positionsSectionRef)}
                disabled={!positions || positions.length === 0}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {positions === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : (positions ?? []).length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No open positions yet.
                </div>
              ) : (
                <EntityList<TradePositionRow>
                  data={(positions ?? []).slice(0, 5) as any}
                  columns={
                    [
                      {
                        id: "symbol",
                        header: "Symbol",
                        accessorKey: "symbol",
                        cell: (item: TradePositionRow) => (
                          <div className="font-medium">
                            {String(item.symbol ?? item.instrumentId ?? "—")}
                          </div>
                        ),
                      },
                      {
                        id: "side",
                        header: "Side",
                        accessorKey: "side",
                        cell: (item: TradePositionRow) => (
                          <Badge variant="outline">
                            {String(item.side ?? "—")}
                          </Badge>
                        ),
                      },
                      {
                        id: "qty",
                        header: "Qty",
                        accessorKey: "qty",
                        cell: (item: TradePositionRow) => (
                          <span className="text-sm">
                            {formatMoney(item.qty)}
                          </span>
                        ),
                      },
                      {
                        id: "avgPrice",
                        header: "Avg",
                        accessorKey: "avgPrice",
                        cell: (item: TradePositionRow) => (
                          <span className="text-sm">
                            {formatMoney(item.avgPrice)}
                          </span>
                        ),
                      },
                      {
                        id: "openedAt",
                        header: "Opened",
                        accessorKey: "openedAt",
                        cell: (item: TradePositionRow) => (
                          <span className="text-muted-foreground text-sm">
                            {formatDateTime(item.openedAt)}
                          </span>
                        ),
                      },
                    ] satisfies ColumnDefinition<TradePositionRow>[]
                  }
                  isLoading={false}
                  defaultViewMode="list"
                  viewModes={["list"]}
                  enableSearch={false}
                />
              )}
            </CardContent>
          </Card>

          <div ref={positionsSectionRef} className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle>All Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {positions === undefined ? (
                  <div className="text-muted-foreground text-sm">Loading…</div>
                ) : (positions ?? []).length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No open positions yet.
                  </div>
                ) : (
                  <EntityList<TradePositionRow>
                    data={(positions ?? []) as any}
                    columns={
                      [
                        {
                          id: "symbol",
                          header: "Symbol",
                          accessorKey: "symbol",
                          cell: (item: TradePositionRow) => (
                            <div className="font-medium">
                              {String(item.symbol ?? item.instrumentId ?? "—")}
                            </div>
                          ),
                        },
                        {
                          id: "side",
                          header: "Side",
                          accessorKey: "side",
                          cell: (item: TradePositionRow) => (
                            <Badge variant="outline">
                              {String(item.side ?? "—")}
                            </Badge>
                          ),
                        },
                        {
                          id: "qty",
                          header: "Qty",
                          accessorKey: "qty",
                          cell: (item: TradePositionRow) => (
                            <span className="text-sm">
                              {formatMoney(item.qty)}
                            </span>
                          ),
                        },
                        {
                          id: "avgPrice",
                          header: "Avg",
                          accessorKey: "avgPrice",
                          cell: (item: TradePositionRow) => (
                            <span className="text-sm">
                              {formatMoney(item.avgPrice)}
                            </span>
                          ),
                        },
                        {
                          id: "openedAt",
                          header: "Opened",
                          accessorKey: "openedAt",
                          cell: (item: TradePositionRow) => (
                            <span className="text-muted-foreground text-sm">
                              {formatDateTime(item.openedAt)}
                            </span>
                          ),
                        },
                        {
                          id: "updatedAt",
                          header: "Updated",
                          accessorKey: "updatedAt",
                          cell: (item: TradePositionRow) => (
                            <span className="text-muted-foreground text-sm">
                              {formatDateTime(item.updatedAt)}
                            </span>
                          ),
                        },
                      ] satisfies ColumnDefinition<TradePositionRow>[]
                    }
                    isLoading={false}
                    defaultViewMode="list"
                    viewModes={["list"]}
                    enableSearch={true}
                    initialSort={{ id: "updatedAt", direction: "desc" }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div ref={ordersSectionRef} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders === undefined ? (
                  <div className="text-muted-foreground text-sm">Loading…</div>
                ) : (orders ?? []).length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No open/pending orders found.
                  </div>
                ) : (
                  <EntityList<TradeOrderRow>
                    data={(orders ?? []) as any}
                    columns={
                      [
                        {
                          id: "symbol",
                          header: "Symbol",
                          accessorKey: "symbol",
                          cell: (item: TradeOrderRow) => (
                            <div className="font-medium">
                              {String(item.symbol ?? item.instrumentId ?? "—")}
                            </div>
                          ),
                        },
                        {
                          id: "side",
                          header: "Side",
                          accessorKey: "side",
                          cell: (item: TradeOrderRow) => (
                            <Badge variant="outline">
                              {String(item.side ?? "—")}
                            </Badge>
                          ),
                        },
                        {
                          id: "status",
                          header: "Status",
                          accessorKey: "status",
                          cell: (item: TradeOrderRow) => (
                            <Badge variant="secondary">
                              {String(item.status ?? "—")}
                            </Badge>
                          ),
                        },
                        {
                          id: "externalOrderId",
                          header: "Order ID",
                          accessorKey: "externalOrderId",
                          cell: (item: TradeOrderRow) => (
                            <span className="text-muted-foreground font-mono text-xs">
                              {String(item.externalOrderId)}
                            </span>
                          ),
                        },
                        {
                          id: "updatedAt",
                          header: "Updated",
                          accessorKey: "updatedAt",
                          cell: (item: TradeOrderRow) => (
                            <span className="text-muted-foreground text-sm">
                              {formatDateTime(item.updatedAt)}
                            </span>
                          ),
                        },
                      ] satisfies ColumnDefinition<TradeOrderRow>[]
                    }
                    isLoading={false}
                    defaultViewMode="list"
                    viewModes={["list"]}
                    enableSearch={true}
                    initialSort={{ id: "updatedAt", direction: "desc" }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <details className="rounded-md border p-3">
                  <summary className="cursor-pointer text-sm font-medium select-none">
                    View history ({(ordersHistory ?? []).length})
                  </summary>
                  <div className="pt-3">
                    {ordersHistory === undefined ? (
                      <div className="text-muted-foreground text-sm">
                        Loading…
                      </div>
                    ) : (ordersHistory ?? []).length === 0 ? (
                      <div className="text-muted-foreground text-sm">
                        No filled/canceled/rejected orders found.
                      </div>
                    ) : (
                      <EntityList<TradeOrderRow>
                        data={(ordersHistory ?? []) as any}
                        columns={
                          [
                            {
                              id: "symbol",
                              header: "Symbol",
                              accessorKey: "symbol",
                              cell: (item: TradeOrderRow) => (
                                <div className="font-medium">
                                  {String(
                                    item.symbol ?? item.instrumentId ?? "—",
                                  )}
                                </div>
                              ),
                            },
                            {
                              id: "side",
                              header: "Side",
                              accessorKey: "side",
                              cell: (item: TradeOrderRow) => (
                                <Badge variant="outline">
                                  {String(item.side ?? "—")}
                                </Badge>
                              ),
                            },
                            {
                              id: "status",
                              header: "Status",
                              accessorKey: "status",
                              cell: (item: TradeOrderRow) => (
                                <Badge variant="secondary">
                                  {String(item.status ?? "—")}
                                </Badge>
                              ),
                            },
                            {
                              id: "externalOrderId",
                              header: "Order ID",
                              accessorKey: "externalOrderId",
                              cell: (item: TradeOrderRow) => (
                                <span className="text-muted-foreground font-mono text-xs">
                                  {String(item.externalOrderId)}
                                </span>
                              ),
                            },
                            {
                              id: "updatedAt",
                              header: "Updated",
                              accessorKey: "updatedAt",
                              cell: (item: TradeOrderRow) => (
                                <span className="text-muted-foreground text-sm">
                                  {formatDateTime(item.updatedAt)}
                                </span>
                              ),
                            },
                          ] satisfies ColumnDefinition<TradeOrderRow>[]
                        }
                        isLoading={false}
                        defaultViewMode="list"
                        viewModes={["list"]}
                        enableSearch={true}
                        initialSort={{ id: "updatedAt", direction: "desc" }}
                      />
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Trade Ideas</CardTitle>
                <Badge variant="secondary">Coming soon</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="bg-muted/30 rounded-md border p-4">
                <div className="text-muted-foreground">
                  Trade Ideas are disabled for MVP while we finalize the core
                  TradeLocker data pipeline (Dashboard, Positions, Orders).
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>TradeLocker Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connection ? (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      Status: {String(connection.status ?? "connected")}
                    </Badge>
                    <Badge variant="outline">
                      Account: {String(connection.selectedAccountId ?? "—")}
                    </Badge>
                    <Badge variant="secondary">
                      Last synced: {formatAge(lastSyncAtMs)}
                    </Badge>
                    <Badge variant="secondary">{syncStatusText}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (!organizationId) return;
                        void (async () => {
                          try {
                            await syncNow({ organizationId });
                            toast.success("Sync queued");
                          } catch (e) {
                            console.error(e);
                            toast.error(
                              e instanceof Error ? e.message : "Sync failed",
                            );
                          }
                        })();
                      }}
                    >
                      Sync now
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!organizationId) return;
                        void (async () => {
                          try {
                            await disconnect({ organizationId });
                            toast.success("Disconnected");
                          } catch (e) {
                            console.error(e);
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Failed to disconnect",
                            );
                          }
                        })();
                      }}
                    >
                      Disconnect
                    </Button>
                  </div>

                  {accountState ? (
                    <div className="pt-2">
                      <Separator className="my-2" />
                      <div className="text-muted-foreground text-xs">
                        Account state last updated:{" "}
                        {typeof accountState.updatedAt === "number"
                          ? new Date(accountState.updatedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Environment</Label>
                    <Select
                      value={environment}
                      onValueChange={(v) => setEnvironment(v as TradeLockerEnv)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Server</Label>
                    <Input
                      value={server}
                      onChange={(e) => setServer(e.target.value)}
                      placeholder="e.g. mt5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                    <Button
                      onClick={() => void handleStartConnect()}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Connecting…" : "Connect"}
                    </Button>
                    {connectDraft?.draftId ? (
                      <>
                        <Separator orientation="vertical" className="h-6" />
                        <Select
                          value={selectedAccountKey}
                          onValueChange={(v) => setSelectedAccountKey(v)}
                        >
                          <SelectTrigger className="w-[320px]">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((a, idx) => {
                              const label = String(
                                a.name ??
                                  a.accountName ??
                                  a.accountId ??
                                  a.id ??
                                  `Account ${idx + 1}`,
                              );
                              return (
                                <SelectItem
                                  key={String(idx)}
                                  value={String(idx)}
                                >
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="secondary"
                          onClick={() => void handleFinishConnect()}
                          disabled={isConnecting || !selectedAccountKey}
                        >
                          Save account
                        </Button>
                      </>
                    ) : null}
                  </div>

                  <div className="text-muted-foreground text-xs md:col-span-2">
                    We only store encrypted access/refresh tokens (never your
                    password).
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
