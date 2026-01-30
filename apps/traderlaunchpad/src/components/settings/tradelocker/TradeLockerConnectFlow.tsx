"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useAction, useConvexAuth, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Progress } from "@acme/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { cn } from "~/lib/utils";

type AccountOption = {
  id: string;
  name?: string;
  currency?: string;
  status?: string;
  accNum?: number;
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

type FlowStep = "broker" | "credentials" | "account" | "sync" | "summary";

type BrokerOption = {
  id: string;
  label: string;
  server: string;
  description: string;
};

const brokerOptions: BrokerOption[] = [
  {
    id: "herofx",
    label: "HERO FX",
    server: "HEROFX",
    description: "TradeLocker broker account (live + demo).",
  },
];

const steps: Array<{ id: FlowStep; label: string }> = [
  { id: "broker", label: "Broker" },
  { id: "credentials", label: "Credentials" },
  { id: "account", label: "Account" },
  { id: "sync", label: "Sync" },
  { id: "summary", label: "Summary" },
];

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

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

    const accNum =
      toNumber(rec.accNum) ??
      toNumber(rec.acc_num) ??
      toNumber(rec.accountNumber) ??
      toNumber(rec.account_number) ??
      null;

    out.push({
      id: rawId,
      name: typeof rec.name === "string" ? rec.name : undefined,
      currency: typeof rec.currency === "string" ? rec.currency : undefined,
      status: typeof rec.status === "string" ? rec.status : undefined,
      accNum: accNum ?? undefined,
    });
  }
  return out;
};

export function TradeLockerConnectFlow(props: {
  onCancel?: () => void;
  onSuccess?: () => void;
  mode?: "user" | "platform";
}) {
  const mode = props.mode ?? "user";
  const startConnect = useAction(
    mode === "platform"
      ? api.platform.brokerConnectionsActions.startPlatformTradeLockerConnect
      : api.traderlaunchpad.actions.startTradeLockerConnect,
  );
  const finishConnect = useAction(
    mode === "platform"
      ? api.platform.brokerConnectionsActions.connectPlatformTradeLocker
      : api.traderlaunchpad.actions.connectTradeLocker,
  );
  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const fetchAccountState = useAction(
    api.traderlaunchpad.actions.fetchMyTradeLockerAccountState,
  );

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const isDev = process.env.NODE_ENV !== "production";

  const [step, setStep] = React.useState<FlowStep>("broker");
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [connecting, setConnecting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [syncStatus, setSyncStatus] = React.useState("Preparing sync…");
  const [syncProgress, setSyncProgress] = React.useState(8);

  const [environment, setEnvironment] = React.useState<"demo" | "live">("demo");
  const [selectedBrokerId, setSelectedBrokerId] = React.useState(
    brokerOptions[0]?.id ?? "",
  );
  const [serverInput, setServerInput] = React.useState(
    brokerOptions[0]?.server ?? "HEROFX",
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [draftId, setDraftId] = React.useState<string | null>(null);
  const [accountsRaw, setAccountsRaw] = React.useState<Array<unknown>>([]);
  const [accountOptions, setAccountOptions] = React.useState<Array<AccountOption>>(
    [],
  );
  const [selectedAccountId, setSelectedAccountId] = React.useState("");
  const [selectedAccNum, setSelectedAccNum] = React.useState<string>("");
  const [accountStatePreview, setAccountStatePreview] = React.useState<unknown>(null);

  const [debugReturnTokens, setDebugReturnTokens] = React.useState(false);
  const [debugTokens, setDebugTokens] = React.useState<DebugTokens | null>(null);
  const [revealDebugTokens, setRevealDebugTokens] = React.useState(false);

  const summaryRaw = useQuery(
    api.traderlaunchpad.queries.getMyTradeIdeaAnalyticsSummary,
    shouldQuery && step === "summary" && mode === "user"
      ? { limit: 200, accountId: selectedAccountId || undefined }
      : "skip",
  ) as
    | {
        sampleSize: number;
        closedTrades: number;
        openTrades: number;
        winRate: number;
        avgWin: number;
        avgLoss: number;
        expectancy: number;
        totalFees: number;
        totalPnl: number;
      }
    | undefined;

  const accountStateRaw = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerAccountState,
    shouldQuery && step === "summary" && mode === "user" ? {} : "skip",
  ) as unknown;

  const reset = () => {
    setDraftId(null);
    setAccountsRaw([]);
    setAccountOptions([]);
    setSelectedAccountId("");
    setSelectedAccNum("");
    setDebugTokens(null);
    setRevealDebugTokens(false);
    setSyncError(null);
    setSyncStatus("Preparing sync…");
    setSyncProgress(8);
    setAccountStatePreview(null);
  };

  const stepIndex = steps.findIndex((s) => s.id === step);
  const setStepWithDirection = (next: FlowStep) => {
    const nextIndex = steps.findIndex((s) => s.id === next);
    setDirection(nextIndex >= stepIndex ? 1 : -1);
    setStep(next);
  };

  React.useEffect(() => {
    const selected = brokerOptions.find((b) => b.id === selectedBrokerId);
    if (selected?.server) setServerInput(selected.server);
  }, [selectedBrokerId]);

  React.useEffect(() => {
    if (!selectedAccountId) return;
    const found = accountOptions.find((a) => a.id === selectedAccountId);
    if (!found?.accNum) return;
    setSelectedAccNum(String(found.accNum));
  }, [accountOptions, selectedAccountId]);

  React.useEffect(() => {
    if (step !== "sync") return;
    setSyncProgress(10);
    const timer = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 96) return prev;
        return Math.min(96, prev + Math.max(2, Math.round(Math.random() * 5)));
      });
    }, 500);
    return () => clearInterval(timer);
  }, [step]);

  const handleStartConnect = async () => {
    setConnecting(true);
    setError(null);
    setSyncError(null);
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
      const raw = Array.isArray(res.accounts) ? res.accounts : [];
      setAccountsRaw(raw);
      setAccountOptions(toAccountOptions(raw));
      if (isDev && res.debugTokens?.accessToken && res.debugTokens?.refreshToken) {
        setDebugTokens({
          accessToken: res.debugTokens.accessToken,
          refreshToken: res.debugTokens.refreshToken,
        });
      }
      setStepWithDirection("account");
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
      if (mode === "platform") {
        await finishConnect({
          draftId,
          selectedAccountId,
          selectedAccNum: accNum,
          accounts: accountsRaw,
        });
      } else {
        await finishConnect({
          draftId,
          selectedAccountId,
          selectedAccNum: accNum,
          selectedAccountName: selectedMeta?.name,
          selectedAccountCurrency: selectedMeta?.currency,
          selectedAccountStatus: selectedMeta?.status,
        });
      }
      if (mode === "platform") {
        props.onSuccess?.();
        return;
      }
      setStepWithDirection("sync");
      await runSyncSequence();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const runSyncSequence = async () => {
    if (mode !== "user") return;
    setSyncing(true);
    setSyncError(null);
    setSyncStatus("Syncing your trades…");
    try {
      await syncNow({});
      setSyncStatus("Fetching account balance…");
      const stateRes = await fetchAccountState({});
      if (stateRes && typeof stateRes === "object") {
        const rec = stateRes as Record<string, unknown>;
        if (rec.accountState) setAccountStatePreview(rec.accountState);
      }
      setSyncStatus("Preparing your summary…");
      setSyncProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStepWithDirection("summary");
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const resolvedAccountState = React.useMemo(() => {
    if (accountStatePreview && typeof accountStatePreview === "object") {
      return accountStatePreview as Record<string, unknown>;
    }
    if (!accountStateRaw || typeof accountStateRaw !== "object") return null;
    const rec = accountStateRaw as Record<string, unknown>;
    return isRecord(rec.raw) ? rec.raw : null;
  }, [accountStatePreview, accountStateRaw]);

  const balance = React.useMemo(() => {
    if (!resolvedAccountState) return null;
    return (
      toNumber(resolvedAccountState.balance) ??
      toNumber(resolvedAccountState.accountBalance) ??
      toNumber(resolvedAccountState.account_balance) ??
      null
    );
  }, [resolvedAccountState]);

  const equity = React.useMemo(() => {
    if (!resolvedAccountState) return null;
    return (
      toNumber(resolvedAccountState.equity) ??
      toNumber(resolvedAccountState.accountEquity) ??
      toNumber(resolvedAccountState.account_equity) ??
      null
    );
  }, [resolvedAccountState]);

  React.useEffect(() => {
    if (step !== "summary") return;
    const timer = setTimeout(() => {
      props.onSuccess?.();
    }, 2600);
    return () => clearTimeout(timer);
  }, [step, props.onSuccess]);

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      x: dir === 1 ? 28 : -28,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
    exit: (dir: 1 | -1) => ({
      x: dir === 1 ? -28 : 28,
      opacity: 0,
      filter: "blur(4px)",
    }),
  } as const;

  const marketingSlides = [
    {
      title: "Trade Journal",
      description: "See your win rate, streaks, and performance curves.",
      href: "/admin/journal",
    },
    {
      title: "Review Trades",
      description: "Rate and analyze every trade with tags and notes.",
      href: "/admin/orders",
    },
    {
      title: "Strategy Library",
      description: "Turn your best setups into repeatable playbooks.",
      href: "/admin/tradeideas",
    },
  ];
  const [slideIndex, setSlideIndex] = React.useState(0);
  React.useEffect(() => {
    if (step !== "sync") return;
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % marketingSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [step, marketingSlides.length]);

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-linear-to-b from-white/5 via-black/20 to-black/30 p-5 shadow-2xl shadow-black/30 sm:p-6">
      <div className="space-y-2">
        <div className="text-base font-semibold text-white/90 sm:text-lg">
          Connect TradeLocker
        </div>
        <div className="text-xs text-white/55 sm:text-sm">
          Connect your broker, sync trades, and see a quick performance summary.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50 sm:gap-3">
        {steps.map((s, idx) => {
          const active = idx === stepIndex;
          const completed = idx < stepIndex;
          return (
            <div
              key={s.id}
              className={cn(
                "rounded-full border border-white/10 px-2.5 py-1",
                active && "border-white/50 bg-white/10 text-white",
                completed && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
              )}
            >
              {s.label}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.7 }}
          className="min-h-[300px] sm:min-h-[340px]"
        >
          {step === "broker" ? (
            <div className="space-y-5">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label>Environment</Label>
                  <Select
                    value={environment}
                    onValueChange={(v) => setEnvironment(v === "live" ? "live" : "demo")}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Broker</Label>
                  <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select broker..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brokerOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-[11px] text-white/45 sm:text-xs">
                    {brokerOptions.find((b) => b.id === selectedBrokerId)?.description ??
                      "Select a supported TradeLocker broker."}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="h-10 bg-orange-600 text-white hover:bg-orange-700"
                  onClick={() => setStepWithDirection("credentials")}
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => props.onCancel?.()}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {step === "credentials" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="h-10"
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

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="h-10 bg-orange-600 text-white hover:bg-orange-700"
                  onClick={handleStartConnect}
                  disabled={connecting}
                >
                  {connecting ? "Connecting..." : "Fetch accounts"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setStepWithDirection("broker")}
                  disabled={connecting}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : null}

          {step === "account" ? (
            <div className="space-y-5">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label>Account</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="h-10">
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
                    className="h-10 font-mono"
                    readOnly={Boolean(selectedMeta?.accNum)}
                    disabled={Boolean(selectedMeta?.accNum)}
                  />
                  {selectedMeta?.accNum ? (
                    <div className="text-[11px] text-white/45 sm:text-xs">
                      Auto-filled from your selected account.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="h-10 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleFinishConnect}
                  disabled={connecting}
                >
                  {connecting ? "Saving..." : "Connect & sync"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setStepWithDirection("credentials")}
                  disabled={connecting}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : null}

          {step === "sync" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-white/80 sm:text-base">
                  Importing your trades
                </div>
                <div className="text-xs text-white/55 sm:text-sm">{syncStatus}</div>
                <Progress value={syncProgress} className="h-2.5" />
              </div>

              <div className="rounded-xl border border-white/10 bg-linear-to-r from-white/5 via-black/20 to-black/20 p-4 sm:p-5">
                <div className="text-xs text-white/60 sm:text-sm">
                  While we sync, explore:
                </div>
                <div className="mt-3 min-h-[140px] rounded-lg border border-white/10 bg-black/30 p-4 sm:min-h-[180px] sm:p-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slideIndex}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="space-y-2"
                    >
                      <div className="text-base font-semibold text-white/90 sm:text-lg">
                        {marketingSlides[slideIndex]?.title}
                      </div>
                      <div className="text-xs text-white/60 sm:text-sm">
                        {marketingSlides[slideIndex]?.description}
                      </div>
                      {marketingSlides[slideIndex]?.href ? (
                        <div className="pt-2">
                          <a
                            href={marketingSlides[slideIndex]?.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-orange-300 hover:text-orange-200 sm:text-sm"
                          >
                            Open feature in new tab
                          </a>
                        </div>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {syncError ? (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-rose-200">
                  {syncError}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => props.onSuccess?.()}
                  disabled={syncing}
                >
                  Skip summary
                </Button>
                {syncError ? (
                  <Button
                    type="button"
                    className="h-10 bg-orange-600 text-white hover:bg-orange-700"
                    onClick={runSyncSequence}
                    disabled={syncing}
                  >
                    Retry sync
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === "summary" ? (
            <div className="space-y-5">
              <div className="text-sm font-semibold text-white/80 sm:text-base">
                Import complete
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Win rate</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? `${Math.round(summaryRaw.winRate * 100)}%` : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Total PnL</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? summaryRaw.totalPnl.toFixed(2) : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Closed trades</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? summaryRaw.closedTrades.toLocaleString() : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Avg win</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? summaryRaw.avgWin.toFixed(2) : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Avg loss</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? summaryRaw.avgLoss.toFixed(2) : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Expectancy</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {summaryRaw ? summaryRaw.expectancy.toFixed(2) : "—"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Balance</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {balance !== null ? balance.toFixed(2) : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-white/50">Equity</div>
                  <div className="mt-1 text-lg font-semibold text-white/90 sm:text-xl">
                    {equity !== null ? equity.toFixed(2) : "—"}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="h-10 bg-orange-600 text-white hover:bg-orange-700"
                  asChild
                >
                  <Link href="/admin/journal" target="_blank" rel="noreferrer">
                    View full journal
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => props.onSuccess?.()}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

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

