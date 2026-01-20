"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

type AccountOption = {
  id: string;
  name?: string;
  currency?: string;
  status?: string;
};

type DebugTokens = {
  accessToken: string;
  refreshToken: string;
};

type StartConnectResult = {
  draftId: string;
  accounts: Array<unknown>;
  debugTokens?: DebugTokens;
};

const toAccountOptions = (rows: Array<unknown>): Array<AccountOption> => {
  const out: Array<AccountOption> = [];
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const rec = row as Record<string, unknown>;
    const rawId =
      (typeof rec.accountId === "string" && rec.accountId) ||
      (typeof rec.id === "string" && rec.id) ||
      (typeof rec._id === "string" && rec._id) ||
      "";
    if (!rawId) continue;

    out.push({
      id: rawId,
      name: typeof rec.name === "string" ? rec.name : undefined,
      currency: typeof rec.currency === "string" ? rec.currency : undefined,
      status: typeof rec.status === "string" ? rec.status : undefined,
    });
  }
  return out;
};

export function TradeLockerConnectFlow(props: {
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const startConnect = useAction(api.traderlaunchpad.actions.startTradeLockerConnect);
  const finishConnect = useAction(api.traderlaunchpad.actions.connectTradeLocker);

  const isDev = process.env.NODE_ENV !== "production";

  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [environment, setEnvironment] = React.useState<"demo" | "live">("demo");
  const [serverInput, setServerInput] = React.useState("HEROFX");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [accountOptions, setAccountOptions] = React.useState<Array<AccountOption>>(
    [],
  );
  const [selectedAccountId, setSelectedAccountId] = React.useState("");
  const [selectedAccNum, setSelectedAccNum] = React.useState<string>("");

  const [debugReturnTokens, setDebugReturnTokens] = React.useState(false);
  const [debugTokens, setDebugTokens] = React.useState<DebugTokens | null>(null);
  const [revealDebugTokens, setRevealDebugTokens] = React.useState(false);

  const reset = () => {
    setDraftId(null);
    setAccountOptions([]);
    setSelectedAccountId("");
    setSelectedAccNum("");
    setDebugTokens(null);
    setRevealDebugTokens(false);
  };

  const handleStartConnect = async () => {
    setConnecting(true);
    setError(null);
    reset();
    try {
      const resUnknown: unknown = await startConnect({
        environment,
        server: serverInput.trim(),
        email: email.trim(),
        password,
        debugReturnTokens: isDev ? debugReturnTokens : false,
      });
      const res = resUnknown as StartConnectResult;

      setDraftId(res.draftId);
      setAccountOptions(toAccountOptions(Array.isArray(res.accounts) ? res.accounts : []));
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

  const selectedMeta = React.useMemo(() => {
    const hit = accountOptions.find((a) => a.id === selectedAccountId);
    return hit ?? null;
  }, [accountOptions, selectedAccountId]);

  const handleFinishConnect = async () => {
    if (!draftId) {
      setError("Start connect first.");
      return;
    }
    const accNum = Number(selectedAccNum);
    if (!selectedAccountId || !Number.isFinite(accNum) || accNum <= 0) {
      setError("Pick an account first.");
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      await finishConnect({
        draftId,
        selectedAccountId,
        selectedAccNum: accNum,
        selectedAccountName: selectedMeta?.name,
        selectedAccountCurrency: selectedMeta?.currency,
        selectedAccountStatus: selectedMeta?.status,
      });
      props.onSuccess?.();
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

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white/80">Connect TradeLocker</div>
      <div className="text-xs text-white/55">
        Enter your TradeLocker credentials to fetch accounts, then select which account to
        connect.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Environment</Label>
          <Select
            value={environment}
            onValueChange={(v) => setEnvironment(v === "live" ? "live" : "demo")}
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
          onClick={() => props.onCancel?.()}
          disabled={connecting}
        >
          Cancel
        </Button>
      </div>

      {draftId ? (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-white/70">Select account</div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.slice(0, 200).map((a) => {
                    const label = `${a.name ?? "Account"} • ${a.id}`;
                    return (
                      <SelectItem key={a.id} value={a.id}>
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
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}

