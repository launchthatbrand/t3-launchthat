"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Plug, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useAction, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useRouter } from "next/navigation";
import { TradeLockerProviderCard } from "./tradelocker/TradeLockerProviderCard";

export function TradeLockerConnectionCard() {
  // Backwards-compatible wrapper (used in onboarding + older pages).
  // New Settings Connections UI uses route-based list/detail.
  return <TradeLockerProviderCard showAccounts />;
}

// Legacy implementation retained below (can be deleted once no longer referenced).
export function TradeLockerConnectionCard_Legacy() {
  const router = useRouter();
  const data = useQuery(api.traderlaunchpad.queries.getMyTradeLockerConnection);
  const disconnect = useAction(api.traderlaunchpad.actions.disconnectTradeLocker);
  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const startConnect = useAction(api.traderlaunchpad.actions.startTradeLockerConnect);
  const finishConnect = useAction(api.traderlaunchpad.actions.connectTradeLocker);
  const refreshAccountConfig = useAction(
    api.traderlaunchpad.actions.refreshMyTradeLockerAccountConfig,
  );

  const isDev = process.env.NODE_ENV !== "production";

  const [disconnecting, setDisconnecting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const connection = data?.connection as any | undefined;
  const polling = data?.polling;
  const connectedAccounts = Array.isArray((data as any)?.accounts)
    ? (((data as any).accounts as any[]) ?? [])
    : [];
  const status: string = typeof connection?.status === "string" ? connection.status : "disconnected";
  const isConnected = status === "connected";

  const [showConnect, setShowConnect] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [environment, setEnvironment] = React.useState<"demo" | "live">("demo");
  const [serverInput, setServerInput] = React.useState("HEROFX");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedAccountId, setSelectedAccountId] = React.useState("");
  const [selectedAccNum, setSelectedAccNum] = React.useState<string>("");
  const selectedAccountMeta = React.useMemo(() => {
    if (!selectedAccountId) return null;
    const a =
      accounts.find(
        (row) =>
          String(row?.accountId ?? row?.id ?? row?._id ?? "") === selectedAccountId,
      ) ?? null;
    if (!a) return null;
    return {
      name: typeof a?.name === "string" ? a.name : undefined,
      currency: typeof a?.currency === "string" ? a.currency : undefined,
      status: typeof a?.status === "string" ? a.status : undefined,
    };
  }, [accounts, selectedAccountId]);

  // DEV-ONLY: optionally surface raw tokens to copy for debugging.
  const [debugReturnTokens, setDebugReturnTokens] = React.useState(false);
  const [debugTokens, setDebugTokens] = React.useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [revealDebugTokens, setRevealDebugTokens] = React.useState(false);

  React.useEffect(() => {
    // If the user disconnects, automatically show connect UI again.
    if (!isConnected) setShowConnect(true);
  }, [isConnected]);

  React.useEffect(() => {
    if (!selectedAccountId) return;
    const a =
      accounts.find(
        (row) =>
          String(row?.accountId ?? row?.id ?? row?._id ?? "") === selectedAccountId,
      ) ?? null;
    if (!a) return;
    const nextAccNum = String(a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? "").trim();
    if (nextAccNum) setSelectedAccNum(nextAccNum);
  }, [accounts, selectedAccountId]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await disconnect({});
      // Convex subscriptions should update automatically; router.refresh helps in case
      // some parts of the page depend on server components.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      await syncNow({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const resetConnectFlow = () => {
    setDraftId(null);
    setAccounts([]);
    setSelectedAccountId("");
    setSelectedAccNum("");
    setDebugTokens(null);
    setRevealDebugTokens(false);
  };

  const handleStartConnect = async () => {
    setConnecting(true);
    setError(null);
    resetConnectFlow();
    try {
      const res = await startConnect({
        environment,
        server: serverInput.trim(),
        email: email.trim(),
        password,
        debugReturnTokens: isDev ? debugReturnTokens : false,
      });
      setDraftId(res.draftId);
      setAccounts(Array.isArray(res.accounts) ? res.accounts : []);
      if (isDev && res.debugTokens?.accessToken && res.debugTokens?.refreshToken) {
        setDebugTokens({
          accessToken: res.debugTokens.accessToken,
          refreshToken: res.debugTokens.refreshToken,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRefreshConfigForRow = async (row: any) => {
    setError(null);
    try {
      await refreshAccountConfig({
        accountRowId: String(row?._id ?? ""),
        accNum: Number(row?.accNum ?? 0),
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleFinishConnect = async () => {
    if (!draftId) {
      setError("Start connect first.");
      return;
    }
    const accNumNum = Number(selectedAccNum);
    if (!selectedAccountId || !Number.isFinite(accNumNum) || accNumNum <= 0) {
      setError("Pick an account first.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await finishConnect({
        draftId,
        selectedAccountId,
        selectedAccNum: accNumNum,
        selectedAccountName: selectedAccountMeta?.name,
        selectedAccountCurrency: selectedAccountMeta?.currency,
        selectedAccountStatus: selectedAccountMeta?.status,
      });
      resetConnectFlow();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const accountId =
    typeof connection?.selectedAccountId === "string" ? connection.selectedAccountId : "—";
  const accNum =
    typeof connection?.selectedAccNum === "number" ? connection.selectedAccNum : null;
  const server = typeof connection?.server === "string" ? connection.server : "—";

  return (
    <Card className={isConnected ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-white/10"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              TradeLocker
              {isConnected ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                >
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-white/5 text-white/60">
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Primary trading account connection.
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10">
            <Plug className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 grid gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Server</span>
            <span className="font-medium">{server}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono font-medium">{accountId}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">accNum</span>
            <span className="font-mono font-medium">{accNum ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Synced</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {polling?.lastSyncAt && polling.lastSyncAt > 0
                  ? new Date(polling.lastSyncAt).toLocaleString()
                  : "—"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSyncNow}
                disabled={!isConnected || syncing}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {isConnected ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/80">Accounts</div>
                <div className="mt-1 text-xs text-white/55">
                  Each account can have different access flags (from{" "}
                  <span className="font-mono">/trade/config</span>).
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setShowConnect(true)}
                disabled={connecting}
              >
                Add account
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {connectedAccounts.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/60">
                  No accounts saved yet. Click{" "}
                  <span className="font-semibold text-white/80">Add account</span>.
                </div>
              ) : (
                connectedAccounts.map((row) => {
                  const acc = row?.customerAccess;
                  const hasMarket =
                    typeof acc?.symbolInfo === "boolean" ? Boolean(acc.symbolInfo) : null;
                  const isActive =
                    Number(row?.accNum ?? 0) === Number((connection as any)?.selectedAccNum ?? 0);
                  const checkedAt =
                    typeof row?.lastConfigCheckedAt === "number" ? row.lastConfigCheckedAt : 0;

                  return (
                    <div
                      key={String(row?._id ?? `${row?.accountId ?? ""}:${row?.accNum ?? ""}`)}
                      className="rounded-xl border border-white/10 bg-black/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-white/80">
                              {typeof row?.name === "string" && row.name.trim()
                                ? row.name
                                : `Account ${String(row?.accNum ?? "—")}`}
                            </div>
                            {isActive ? (
                              <Badge className="bg-blue-600/10 text-blue-200 hover:bg-blue-600/20">
                                Active
                              </Badge>
                            ) : null}
                            {hasMarket === true ? (
                              <Badge className="bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20">
                                Market OK
                              </Badge>
                            ) : hasMarket === false ? (
                              <Badge className="bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">
                                Blocked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-white/5 text-white/60">
                                Unknown
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/55">
                            <span className="font-mono">accNum {String(row?.accNum ?? "—")}</span>
                            <span className="font-mono">id {String(row?.accountId ?? "—")}</span>
                            {checkedAt > 0 ? (
                              <span>Checked {new Date(checkedAt).toLocaleString()}</span>
                            ) : null}
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => void handleRefreshConfigForRow(row)}
                        >
                          Refresh status
                        </Button>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-white/70 hover:text-white">
                          Debug
                        </summary>
                        <div className="mt-2 grid gap-2 rounded-lg border border-white/10 bg-black/40 p-3 text-[12px] text-white/70">
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            <div>orders: {String(acc?.orders ?? "—")}</div>
                            <div>ordersHistory: {String(acc?.ordersHistory ?? "—")}</div>
                            <div>filledOrders: {String(acc?.filledOrders ?? "—")}</div>
                            <div>positions: {String(acc?.positions ?? "—")}</div>
                            <div>symbolInfo: {String(acc?.symbolInfo ?? "—")}</div>
                            <div>marketDepth: {String(acc?.marketDepth ?? "—")}</div>
                          </div>
                          {typeof row?.lastConfigError === "string" && row.lastConfigError ? (
                            <div className="rounded-md border border-white/10 bg-black/40 p-2 text-rose-200">
                              {row.lastConfigError}
                            </div>
                          ) : null}
                        </div>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {showConnect ? (
          <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold text-white/80">
              Connect TradeLocker
            </div>
            <div className="text-xs text-white/55">
              This uses your TradeLocker login to fetch a JWT, then stores the
              resulting tokens for syncing. (Dev flow)
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Environment</Label>
                <Select
                  value={environment}
                  onValueChange={(v) =>
                    setEnvironment(v === "live" ? "live" : "demo")
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Server</Label>
                <Input
                  value={serverInput}
                  onChange={(e) => setServerInput(e.target.value)}
                  placeholder="HEROFX"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-9"
                />
              </div>
            </div>

            {isDev ? (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="tl-debug-return-tokens"
                  checked={debugReturnTokens}
                  onCheckedChange={(v) => setDebugReturnTokens(Boolean(v))}
                />
                <Label
                  htmlFor="tl-debug-return-tokens"
                  className="cursor-pointer text-xs text-white/60"
                >
                  Dev only: return raw tokens (for copy/debug)
                </Label>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-orange-600 text-white hover:bg-orange-700"
                onClick={handleStartConnect}
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Fetch accounts"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => {
                  resetConnectFlow();
                  setShowConnect(false);
                }}
                disabled={connecting}
              >
                Cancel
              </Button>
            </div>

            {draftId ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-white/70">
                  Select account
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Account</Label>
                    <Select
                      value={selectedAccountId}
                      onValueChange={setSelectedAccountId}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.slice(0, 200).map((a, idx) => {
                          const id = String(a?.accountId ?? a?.id ?? a?._id ?? "");
                          if (!id) return null;
                          const label =
                            String(a?.name ?? a?.server ?? a?.broker ?? "Account") +
                            ` • ${id}`;
                          return (
                            <SelectItem key={`${id}:${idx}`} value={id}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>accNum</Label>
                    <Input
                      value={selectedAccNum}
                      onChange={(e) => setSelectedAccNum(e.target.value)}
                      placeholder="1"
                      className="h-9 font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="h-9 w-full bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleFinishConnect}
                  disabled={connecting}
                >
                  {connecting ? "Saving..." : "Connect"}
                </Button>
              </div>
            ) : null}

            {isDev && debugTokens ? (
              <div className="space-y-2 rounded-lg border border-white/10 bg-black/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white/70">
                    Debug tokens (dev)
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevealDebugTokens((v) => !v)}
                  >
                    {revealDebugTokens ? "Hide" : "Reveal"}
                  </Button>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-white/50">Access token</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-hidden text-ellipsis rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[11px] text-white/70">
                        {revealDebugTokens
                          ? debugTokens.accessToken
                          : `${debugTokens.accessToken.slice(0, 18)}…${debugTokens.accessToken.slice(-10)}`}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(debugTokens.accessToken)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] text-white/50">Refresh token</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-hidden text-ellipsis rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[11px] text-white/70">
                        {revealDebugTokens
                          ? debugTokens.refreshToken
                          : `${debugTokens.refreshToken.slice(0, 18)}…${debugTokens.refreshToken.slice(-10)}`}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(debugTokens.refreshToken)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-white/45">
                  Returned only in dev when enabled. Not persisted in UI state after reset.
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            {error}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleDisconnect}
          disabled={!isConnected || disconnecting}
        >
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSyncNow}
          disabled={!isConnected || syncing}
        >
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
        {!isConnected ? (
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => setShowConnect(true)}
            disabled={connecting}
          >
            Connect
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowConnect((v) => !v)}
            disabled={connecting}
          >
            Update credentials
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
