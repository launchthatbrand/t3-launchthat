"use client";

import React from "react";
import { Plug, RefreshCw } from "lucide-react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { useRouter } from "next/navigation";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

export function TradeLockerConnectionCard() {
  const router = useRouter();
  const data = useQuery(api.traderlaunchpad.queries.getMyTradeLockerConnection);
  const disconnect = useAction(api.traderlaunchpad.actions.disconnectTradeLocker);
  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const startConnect = useAction(api.traderlaunchpad.actions.startTradeLockerConnect);
  const finishConnect = useAction(api.traderlaunchpad.actions.connectTradeLocker);

  const [disconnecting, setDisconnecting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const connection = data?.connection as any | undefined;
  const polling = data?.polling;
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

  React.useEffect(() => {
    // If the user disconnects, automatically show connect UI again.
    if (!isConnected) setShowConnect(true);
    if (isConnected) setShowConnect(false);
  }, [isConnected]);

  const parseAccNumFromAccount = (a: any): string => {
    const raw = a?.accNum ?? a?.acc_num ?? a?.accountNumber ?? a?.accountNum;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? String(n) : "";
  };

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
      });
      setDraftId(res.draftId);
      setAccounts(Array.isArray(res.accounts) ? res.accounts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const handleFinishConnect = async () => {
    if (!draftId) {
      setError("Start connect first.");
      return;
    }
    const accNumNum = Number(selectedAccNum);
    if (!selectedAccountId) {
      setError("Pick an account first.");
      return;
    }
    if (!Number.isFinite(accNumNum) || accNumNum <= 0) {
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
                      onValueChange={(value) => {
                        setSelectedAccountId(value);
                        const match =
                          accounts.find(
                            (a) =>
                              String(a?.accountId ?? a?.id ?? a?._id ?? "") ===
                              value,
                          ) ?? null;
                        if (match) {
                          const next = parseAccNumFromAccount(match);
                          if (next) setSelectedAccNum(next);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.slice(0, 200).map((a, idx) => {
                          const id = String(a?.accountId ?? a?.id ?? a?._id ?? "");
                          if (!id) return null;
                          const accNumLabel = parseAccNumFromAccount(a);
                          const label =
                            String(a?.name ?? a?.server ?? a?.broker ?? "Account") +
                            ` • ${id}${accNumLabel ? ` • accNum ${accNumLabel}` : ""}`;
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
                  disabled={connecting || !draftId || !selectedAccountId || !selectedAccNum}
                >
                  {connecting ? "Saving..." : "Connect"}
                </Button>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowConnect((v) => !v)}
          disabled={connecting}
        >
          {isConnected ? "Update credentials" : showConnect ? "Hide connect" : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}
