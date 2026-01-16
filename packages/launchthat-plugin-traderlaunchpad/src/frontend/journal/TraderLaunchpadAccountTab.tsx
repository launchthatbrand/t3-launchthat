"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-return
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
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

type TradeLockerEnv = "demo" | "live";

export const formatMs = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${String(r).padStart(2, "0")}s`;
};

export const formatAge = (ts: number): string => {
  if (!ts || ts <= 0) return "—";
  const diff = Date.now() - ts;
  if (diff < 10_000) return "just now";
  return `${formatMs(diff)} ago`;
};

export type TraderLaunchpadApiAdapter = {
  queries: {
    getMyTradeLockerConnection: any;
    listMyTradeLockerOrders: any;
    listMyTradeLockerOrdersHistory: any;
    listMyTradeLockerPositions: any;
    getMyTradeLockerAccountState: any;
    getMyJournalProfile: any;
  };
  actions: {
    startTradeLockerConnect: any;
    connectTradeLocker: any;
    disconnectTradeLocker: any;
    syncMyTradeLockerNow: any;
    setMyJournalPublic: any;
  };
};

export type TradeOrderRow = Record<string, unknown> & {
  _id: string;
  externalOrderId: string;
  symbol?: string;
  side?: "buy" | "sell";
  status?: string;
  updatedAt: number;
};

export type TradePositionRow = Record<string, unknown> & {
  _id: string;
  externalPositionId: string;
  symbol?: string;
  side?: "buy" | "sell";
  qty?: number;
  avgPrice?: number;
  updatedAt: number;
};

export function TraderLaunchpadAccountTab(props: {
  api: TraderLaunchpadApiAdapter;
  initialTab?: "dashboard" | "orders" | "settings";
}) {
  const tlQueries = props.api.queries;
  const tlActions = props.api.actions;

  const connectionData = useQuery(tlQueries.getMyTradeLockerConnection, {}) as
    | {
        connection: any;
        polling: {
          now: number;
          intervalMs: number;
          lastSyncAt: number;
          nextSyncAt: number;
          isSyncing: boolean;
        };
      }
    | null
    | undefined;

  const myJournalProfile = useQuery(tlQueries.getMyJournalProfile, {}) as
    | { isPublic: boolean }
    | undefined;

  const orders = useQuery(tlQueries.listMyTradeLockerOrders, { limit: 100 }) as
    | TradeOrderRow[]
    | undefined;

  const ordersHistory = useQuery(tlQueries.listMyTradeLockerOrdersHistory, {
    limit: 100,
  }) as TradeOrderRow[] | undefined;

  const positions = useQuery(tlQueries.listMyTradeLockerPositions, {
    limit: 100,
  }) as TradePositionRow[] | undefined;

  const accountState = useQuery(tlQueries.getMyTradeLockerAccountState, {}) as
    | { raw: any }
    | null
    | undefined;

  const startConnect = useAction(tlActions.startTradeLockerConnect);
  const finishConnect = useAction(tlActions.connectTradeLocker);
  const disconnect = useAction(tlActions.disconnectTradeLocker);
  const syncNow = useAction(tlActions.syncMyTradeLockerNow);
  const setMyJournalPublic = useAction(tlActions.setMyJournalPublic);

  const [tab, setTab] = React.useState<string>(props.initialTab ?? "dashboard");

  const [connectEnv, setConnectEnv] = React.useState<TradeLockerEnv>("demo");
  const [connectServer, setConnectServer] = React.useState<string>("");
  const [connectEmail, setConnectEmail] = React.useState<string>("");
  const [connectPassword, setConnectPassword] = React.useState<string>("");
  const [draft, setDraft] = React.useState<{
    draftId: string;
    accounts: any[];
  } | null>(null);

  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("");
  const [selectedAccNum, setSelectedAccNum] = React.useState<number>(1);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isSyncingNow, setIsSyncingNow] = React.useState(false);

  const status = connectionData?.connection?.status as
    | "connected"
    | "error"
    | "disconnected"
    | undefined;

  const lastSyncAt =
    typeof connectionData?.polling?.lastSyncAt === "number"
      ? connectionData.polling.lastSyncAt
      : 0;
  const nextSyncAt =
    typeof connectionData?.polling?.nextSyncAt === "number"
      ? connectionData.polling.nextSyncAt
      : 0;
  const intervalMs =
    typeof connectionData?.polling?.intervalMs === "number"
      ? connectionData.polling.intervalMs
      : 0;
  const isSyncing = Boolean(connectionData?.polling?.isSyncing);

  const syncLabel = React.useMemo(() => {
    if (!lastSyncAt || !intervalMs) return "—";
    const now = Date.now();
    const dueIn = nextSyncAt - now;
    if (isSyncing) return "Syncing now…";
    if (dueIn <= 0) return `Overdue by ${formatMs(Math.abs(dueIn))}`;
    return `Again in ${formatMs(dueIn)}`;
  }, [intervalMs, isSyncing, lastSyncAt, nextSyncAt]);

  const handleStartConnect = async () => {
    setIsConnecting(true);
    try {
      const res = (await startConnect({
        environment: connectEnv,
        server: connectServer,
        email: connectEmail,
        password: connectPassword,
      })) as any;

      const draftId = String(res?.draftId ?? "");
      const accounts = Array.isArray(res?.accounts) ? res.accounts : [];
      if (!draftId) throw new Error("Missing draftId");
      setDraft({ draftId, accounts });

      // Best-effort set defaults from first account.
      const a0 = accounts[0] ?? null;
      if (a0 && typeof a0 === "object") {
        const initialAccountId = String(
          (a0 as any)?.accountId ?? (a0 as any)?.id ?? (a0 as any)?._id ?? "",
        );
        if (initialAccountId) {
          setSelectedAccountId(initialAccountId);
        }
        const initialAccNum = Number(
          (a0 as any)?.accNum ??
            (a0 as any)?.acc_num ??
            (a0 as any)?.accountNumber ??
            0,
        );
        if (Number.isFinite(initialAccNum) && initialAccNum > 0) {
          setSelectedAccNum(initialAccNum);
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start connect",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFinishConnect = async () => {
    if (!draft?.draftId) return;
    setIsConnecting(true);
    try {
      await finishConnect({
        draftId: draft.draftId,
        selectedAccountId,
        selectedAccNum,
      });
      toast.success("Connected");
      setDraft(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      await disconnect({});
      toast.success("Disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncingNow(true);
    try {
      await syncNow({});
      toast.success("Sync triggered");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setIsSyncingNow(false);
    }
  };

  const ordersColumns: ColumnDefinition<TradeOrderRow>[] = [
    { id: "symbol", header: "Symbol", accessorKey: "symbol" },
    {
      id: "side",
      header: "Side",
      accessorKey: "side",
      cell: (item: TradeOrderRow) =>
        item.side === "buy" ? "Buy" : item.side === "sell" ? "Sell" : "—",
    },
    { id: "status", header: "Status", accessorKey: "status" },
    {
      id: "updatedAt",
      header: "Updated",
      accessorKey: "updatedAt",
      cell: (item: TradeOrderRow) =>
        typeof item.updatedAt === "number" ? formatAge(item.updatedAt) : "—",
    },
  ];

  const positionsColumns: ColumnDefinition<TradePositionRow>[] = [
    { id: "symbol", header: "Symbol", accessorKey: "symbol" },
    {
      id: "side",
      header: "Side",
      accessorKey: "side",
      cell: (item: TradePositionRow) =>
        item.side === "buy" ? "Long" : item.side === "sell" ? "Short" : "—",
    },
    {
      id: "qty",
      header: "Qty",
      accessorKey: "qty",
      cell: (item: TradePositionRow) =>
        typeof item.qty === "number" ? item.qty : "—",
    },
    {
      id: "avg",
      header: "Avg",
      accessorKey: "avgPrice",
      cell: (item: TradePositionRow) =>
        typeof item.avgPrice === "number" ? item.avgPrice : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">TradeLocker</div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold">Journal</div>
            {status ? (
              <Badge variant={status === "connected" ? "default" : "outline"}>
                {status}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="text-sm">
          <div>
            <span className="text-muted-foreground">Last synced:</span>{" "}
            {lastSyncAt ? formatAge(lastSyncAt) : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Syncing:</span> {syncLabel}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open positions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {Array.isArray(positions) ? positions.length : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Connected</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {status === "connected" ? "Yes" : "No"}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Positions (preview)</CardTitle>
            </CardHeader>
            <CardContent>
              {positions === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : positions.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No open positions.
                </div>
              ) : (
                <EntityList<TradePositionRow>
                  data={positions.slice(0, 5) as any}
                  columns={positionsColumns as any}
                  viewModes={["list"]}
                  enableSearch={false}
                  enableFooter={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open positions</CardTitle>
            </CardHeader>
            <CardContent>
              {positions === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : positions.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No open positions.
                </div>
              ) : (
                <EntityList<TradePositionRow>
                  data={positions as any}
                  columns={positionsColumns as any}
                  viewModes={["list"]}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : orders.length === 0 ? (
                <div className="text-muted-foreground text-sm">No orders.</div>
              ) : (
                <EntityList<TradeOrderRow>
                  data={orders as any}
                  columns={ordersColumns as any}
                  viewModes={["list"]}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order history</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersHistory === undefined ? (
                <div className="text-muted-foreground text-sm">Loading…</div>
              ) : ordersHistory.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No order history yet.
                </div>
              ) : (
                <EntityList<TradeOrderRow>
                  data={ordersHistory as any}
                  columns={ordersColumns as any}
                  viewModes={["list"]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal visibility</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium">Public journal</div>
                <div className="text-muted-foreground text-sm">
                  If disabled, we won’t stream your trades to Discord (later).
                </div>
              </div>
              <Switch
                checked={myJournalProfile ? myJournalProfile.isPublic : true}
                onCheckedChange={async (checked) => {
                  try {
                    await setMyJournalPublic({ isPublic: checked });
                    toast.success("Updated");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Failed to update",
                    );
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual sync</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSyncNow} disabled={isSyncingNow}>
                {isSyncingNow ? "Syncing…" : "Sync now"}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Connect TradeLocker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === "connected" ? (
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">
                    Connected to{" "}
                    {String(connectionData?.connection?.server ?? "—")}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isConnecting}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Environment</Label>
                      <Select
                        value={connectEnv}
                        onValueChange={(v) =>
                          setConnectEnv(v as TradeLockerEnv)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">demo</SelectItem>
                          <SelectItem value="live">live</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Server</Label>
                      <Input
                        value={connectServer}
                        onChange={(e) => setConnectServer(e.target.value)}
                        placeholder="HEROFX"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        value={connectEmail}
                        onChange={(e) => setConnectEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        value={connectPassword}
                        onChange={(e) => setConnectPassword(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <Button onClick={handleStartConnect} disabled={isConnecting}>
                    {isConnecting ? "Connecting…" : "Sign in to TradeLocker"}
                  </Button>

                  {draft ? (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          Select account
                        </div>
                        <Select
                          value={selectedAccountId}
                          onValueChange={(v) => {
                            setSelectedAccountId(v);
                            const selected = draft.accounts.find((a, idx) => {
                              const accountId = String(
                                (a as any)?.accountId ??
                                  (a as any)?.id ??
                                  (a as any)?._id ??
                                  "",
                              );
                              const fallbackId = accountId || `unknown-${idx}`;
                              return fallbackId === v;
                            });
                            const accNumValue = Number(
                              (selected as any)?.accNum ??
                                (selected as any)?.acc_num ??
                                (selected as any)?.accountNumber ??
                                0,
                            );
                            if (
                              Number.isFinite(accNumValue) &&
                              accNumValue > 0
                            ) {
                              setSelectedAccNum(accNumValue);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose account" />
                          </SelectTrigger>
                          <SelectContent>
                            {draft.accounts.map((a, idx) => {
                              const id = String(
                                (a as any)?.accountId ??
                                  (a as any)?.id ??
                                  (a as any)?._id ??
                                  "",
                              );
                              const label =
                                String((a as any)?.name ?? "") ||
                                id ||
                                `Account ${idx + 1}`;
                              return (
                                <SelectItem
                                  key={id || String(idx)}
                                  value={id || `unknown-${idx}`}
                                >
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <div className="space-y-1">
                          <Label>accNum</Label>
                          <Input
                            value={String(selectedAccNum)}
                            onChange={(e) =>
                              setSelectedAccNum(Number(e.target.value) || 1)
                            }
                          />
                        </div>

                        <Button
                          onClick={handleFinishConnect}
                          disabled={isConnecting}
                        >
                          {isConnecting ? "Saving…" : "Finish connection"}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {accountState ? (
            <Card>
              <CardHeader>
                <CardTitle>Account state (raw)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-xs">
                  {JSON.stringify(accountState.raw, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
