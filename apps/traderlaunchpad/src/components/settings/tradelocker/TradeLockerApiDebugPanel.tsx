"use client";

import * as React from "react";

import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { cn } from "@acme/ui";
import { useTradeLockerApiDebugStore } from "~/stores/tradeLockerApiDebugStore";
import type { TradeLockerDebugTestId } from "~/stores/tradeLockerApiDebugStore";

// IMPORTANT: Must be a stable reference. Returning a fresh `{}` from a zustand selector
// can break `useSyncExternalStore` caching and trigger infinite update loops.
const EMPTY_RESULTS_FOR_ACCOUNT: Partial<
  Record<TradeLockerDebugTestId, { updatedAt: number; value: unknown }>
> = {};

type TestId =
  | "config"
  | "state"
  | "positions"
  | "orders"
  | "ordersHistory"
  | "filledOrders"
  | "executions"
  | "userMe"
  | "userMeAccounts"
  | "reportTradesHistory"
  | "reportClosedPositionsHistory"
  | "reportBalanceHistory"
  | "reportOrderHistory"
  | "backendCloseTradesHistory"
  | "backendReportsDiscovery"
  | "history";

const stringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const COMMON_TRADE_REPORT_PATHS: Array<{ label: string; path: string }> = [
  { label: "close-trades-history", path: "/trade/reports/close-trades-history" },
  { label: "close-trade-history", path: "/trade/reports/close-trade-history" },
  { label: "closed-trades-history", path: "/trade/reports/closed-trades-history" },
  { label: "close-trades", path: "/trade/reports/close-trades" },
  { label: "closed-trades", path: "/trade/reports/closed-trades" },
  { label: "trades-history", path: "/trade/reports/trades-history" },
  { label: "trade-history", path: "/trade/reports/trade-history" },
  { label: "trades", path: "/trade/reports/trades" },
  { label: "closed-positions-history", path: "/trade/reports/closed-positions-history" },
  { label: "close-positions-history", path: "/trade/reports/close-positions-history" },
  { label: "positions-closed-history", path: "/trade/reports/positions-closed-history" },
  { label: "closed-positions", path: "/trade/reports/closed-positions" },
  { label: "order-history", path: "/trade/reports/order-history" },
  { label: "orders-history", path: "/trade/reports/orders-history" },
  { label: "orders", path: "/trade/reports/orders" },
  { label: "balance-history", path: "/trade/reports/balance-history" },
  { label: "equity-history", path: "/trade/reports/equity-history" },
  { label: "account-balance-history", path: "/trade/reports/account-balance-history" },
  { label: "account-history", path: "/trade/reports/account-history" },
  { label: "deals-history", path: "/trade/reports/deals-history" },
  { label: "deal-history", path: "/trade/reports/deal-history" },
  { label: "deals", path: "/trade/reports/deals" },
  { label: "positions-history", path: "/trade/reports/positions-history" },
  { label: "position-history", path: "/trade/reports/position-history" },
  { label: "positions", path: "/trade/reports/positions" },
];

export function TradeLockerApiDebugPanel(props: { accountRowId: string }) {
  const probeConfig = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerConfigForAccountRow,
  );
  const probeEndpoint = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerTradeEndpointForAccountRow,
  );
  const probeHistory = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerHistoryForInstrumentForAccountRow,
  );
  const probeBackendPath = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerBackendPathForAccountRow,
  );

  const [busy, setBusy] = React.useState<TestId | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [instrumentId, setInstrumentId] = React.useState("4685"); // AUDJPY
  const [resolution, setResolution] = React.useState("15m");
  const [lookbackDays, setLookbackDays] = React.useState("3");

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const setResult = useTradeLockerApiDebugStore((s) => s.setResult);
  const resultsForAccount = useTradeLockerApiDebugStore(
    (s) => s.resultsByAccount[props.accountRowId] ?? EMPTY_RESULTS_FOR_ACCOUNT,
  );

  const getResultValue = React.useCallback(
    (key: TradeLockerDebugTestId): unknown => resultsForAccount[key]?.value,
    [resultsForAccount],
  );

  const copyResult = React.useCallback(async (key: string, value: unknown) => {
    try {
      const text = stringify(value);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for older browsers / non-secure contexts.
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "true");
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const runTest = React.useCallback(
    async (id: TestId) => {
      setBusy(id);
      setError(null);
      try {
        if (id === "config") {
          const res = (await probeConfig({
            accountRowId: props.accountRowId,
          })) as unknown;
          setResult({
            accountRowId: props.accountRowId,
            testId: "config",
            value: res,
          });
          return;
        }

        if (id === "history") {
          const res = (await probeHistory({
            accountRowId: props.accountRowId,
            tradableInstrumentId: instrumentId,
            resolution,
            lookbackDays: Number(lookbackDays),
          })) as unknown;
          setResult({
            accountRowId: props.accountRowId,
            testId: "history",
            value: res,
          });
          return;
        }

        if (
          id === "userMe" ||
          id === "userMeAccounts" ||
          id === "reportTradesHistory" ||
          id === "reportClosedPositionsHistory" ||
          id === "reportBalanceHistory" ||
          id === "reportOrderHistory" ||
          id === "backendCloseTradesHistory"
        ) {
          const path =
            id === "userMe"
              ? "/user/me"
              : id === "userMeAccounts"
                ? "/user/me/accounts?includeBalance=true"
                : id === "reportTradesHistory"
                  ? "/v2/user/me/reports/trades-history?accNum={accNum}"
                  : id === "reportClosedPositionsHistory"
                    ? "/user/me/reports/closed-positions-history?accNum={accNum}"
                    : id === "reportBalanceHistory"
                      ? "/user/me/reports/balance-history?accNum={accNum}"
            : id === "reportOrderHistory"
                      ? "/user/me/reports/order-history?accNum={accNum}"
                      : "/backend-api/trade/reports/close-trades-history";

          const res = (await probeBackendPath({
            accountRowId: props.accountRowId,
            path,
          })) as unknown;

          setResult({
            accountRowId: props.accountRowId,
            testId: id as TradeLockerDebugTestId,
            value: res,
          });
          return;
        }

        if (id === "backendReportsDiscovery") {
          const results: Array<{
            label: string;
            path: string;
            ok: boolean;
            status?: number;
            textPreview?: string;
            jsonPreview?: unknown;
          }> = [];

          for (const entry of COMMON_TRADE_REPORT_PATHS) {
            const res = (await probeBackendPath({
              accountRowId: props.accountRowId,
              path: entry.path,
            })) as any;

            results.push({
              label: entry.label,
              path: entry.path,
              ok: Boolean(res?.ok),
              status: typeof res?.status === "number" ? res.status : undefined,
              textPreview: typeof res?.textPreview === "string" ? res.textPreview : undefined,
              jsonPreview: res?.jsonPreview,
            });
          }

          setResult({
            accountRowId: props.accountRowId,
            testId: "backendReportsDiscovery",
            value: { candidates: COMMON_TRADE_REPORT_PATHS, results },
          });
          return;
        }

        const res = (await probeEndpoint({
          accountRowId: props.accountRowId,
          endpoint: id,
        })) as unknown;
        setResult({
          accountRowId: props.accountRowId,
          testId: id as TradeLockerDebugTestId,
          value: res,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [
      instrumentId,
      lookbackDays,
      probeConfig,
      probeBackendPath,
      probeEndpoint,
      probeHistory,
      props.accountRowId,
      resolution,
      setResult,
    ],
  );

  const runAll = async () => {
    // Serial to keep results legible and avoid rate limits.
    await runTest("config");
    await runTest("state");
    await runTest("positions");
    await runTest("orders");
    await runTest("ordersHistory");
    await runTest("filledOrders");
    await runTest("executions");
    await runTest("userMe");
    await runTest("userMeAccounts");
    await runTest("reportTradesHistory");
    await runTest("reportClosedPositionsHistory");
    await runTest("reportBalanceHistory");
    await runTest("reportOrderHistory");
    await runTest("backendCloseTradesHistory");
    await runTest("backendReportsDiscovery");
    await runTest("history");
  };

  const statusBadge = (res: unknown) => {
    if (!res || typeof res !== "object") return null;
    const r = res as Record<string, unknown>;
    const ok = Boolean(r.ok);
    const status = typeof r.status === "number" ? r.status : null;
    const label = status !== null ? `${ok ? "OK" : "ERR"} • ${status}` : ok ? "OK" : "ERR";
    return (
      <Badge
        variant="secondary"
        className={cn(
          "border border-white/10 bg-white/5 text-white/70",
          ok ? "text-emerald-200" : "text-rose-200",
        )}
      >
        {label}
      </Badge>
    );
  };

  const copyButton = (key: string) => {
    const value = getResultValue(key as TradeLockerDebugTestId);
    const disabled = value === undefined || busy !== null;
    return (
      <Button
        type="button"
        variant="outline"
        className="h-8 px-2 text-xs"
        disabled={disabled}
        aria-label={`Copy ${key} response`}
        onClick={() => void copyResult(key, value)}
      >
        {copiedKey === key ? "Copied" : "Copy"}
      </Button>
    );
  };

  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-white/90">TradeLocker API Debug</CardTitle>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            disabled={busy !== null}
            onClick={() => void runAll()}
          >
            {busy ? "Running…" : "Run all tests"}
          </Button>
        </div>
        <div className="text-sm text-white/60">
          Query raw Trade endpoints for this connected account.
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                1) Trade config
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("config"))}
                {copyButton("config")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("config")}
              >
                {busy === "config" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/config"}
              </Badge>
            </div>
            {getResultValue("config") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("config"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                2) Account status (state)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("state"))}
                {copyButton("state")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("state")}
              >
                {busy === "state" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/state"}
              </Badge>
            </div>
            {getResultValue("state") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("state"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                3) Positions
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("positions"))}
                {copyButton("positions")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("positions")}
              >
                {busy === "positions" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/positions"}
              </Badge>
            </div>
            {getResultValue("positions") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("positions"))}
              </pre>
            ) : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">4) Orders</div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("orders"))}
                {copyButton("orders")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("orders")}
              >
                {busy === "orders" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/orders"}
              </Badge>
            </div>
            {getResultValue("orders") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("orders"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                5) Orders history
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("ordersHistory"))}
                {copyButton("ordersHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("ordersHistory")}
              >
                {busy === "ordersHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/ordersHistory"}
              </Badge>
            </div>
            {getResultValue("ordersHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("ordersHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                6) Filled orders
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("filledOrders"))}
                {copyButton("filledOrders")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("filledOrders")}
              >
                {busy === "filledOrders" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/filledOrders"}
              </Badge>
            </div>
            {getResultValue("filledOrders") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("filledOrders"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                7) Executions (candidate endpoint)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("executions"))}
                {copyButton("executions")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("executions")}
              >
                {busy === "executions" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/accounts/{accountId}/executions"}
              </Badge>
            </div>
            {getResultValue("executions") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("executions"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                8) User profile (/user/me)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("userMe"))}
                {copyButton("userMe")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("userMe")}
              >
                {busy === "userMe" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/user/me"}
              </Badge>
            </div>
            {getResultValue("userMe") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("userMe"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                9) Accounts (/user/me/accounts)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("userMeAccounts"))}
                {copyButton("userMeAccounts")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("userMeAccounts")}
              >
                {busy === "userMeAccounts" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/user/me/accounts?includeBalance=true"}
              </Badge>
            </div>
            {getResultValue("userMeAccounts") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("userMeAccounts"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                10) Trades history report (v2)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("reportTradesHistory"))}
                {copyButton("reportTradesHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("reportTradesHistory")}
              >
                {busy === "reportTradesHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/v2/user/me/reports/trades-history?accNum={accNum}"}
              </Badge>
            </div>
            {getResultValue("reportTradesHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("reportTradesHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                11) Closed positions history report
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("reportClosedPositionsHistory"))}
                {copyButton("reportClosedPositionsHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("reportClosedPositionsHistory")}
              >
                {busy === "reportClosedPositionsHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/user/me/reports/closed-positions-history?accNum={accNum}"}
              </Badge>
            </div>
            {getResultValue("reportClosedPositionsHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("reportClosedPositionsHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                12) Balance history report
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("reportBalanceHistory"))}
                {copyButton("reportBalanceHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("reportBalanceHistory")}
              >
                {busy === "reportBalanceHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/user/me/reports/balance-history?accNum={accNum}"}
              </Badge>
            </div>
            {getResultValue("reportBalanceHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("reportBalanceHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                13) Order history report
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("reportOrderHistory"))}
                {copyButton("reportOrderHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("reportOrderHistory")}
              >
                {busy === "reportOrderHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/user/me/reports/order-history?accNum={accNum}"}
              </Badge>
            </div>
            {getResultValue("reportOrderHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("reportOrderHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                14) Close trades history (backend-api)
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("backendCloseTradesHistory"))}
                {copyButton("backendCloseTradesHistory")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("backendCloseTradesHistory")}
              >
                {busy === "backendCloseTradesHistory" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/backend-api/trade/reports/close-trades-history"}
              </Badge>
            </div>
            {getResultValue("backendCloseTradesHistory") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("backendCloseTradesHistory"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/80">
                15) Discover /trade/reports/* endpoints
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("backendReportsDiscovery"))}
                {copyButton("backendReportsDiscovery")}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9 bg-blue-600 text-white hover:bg-blue-700"
                disabled={busy !== null}
                onClick={() => void runTest("backendReportsDiscovery")}
              >
                {busy === "backendReportsDiscovery" ? "Running…" : "Run"}
              </Button>
              <Badge variant="outline" className="border-white/15 text-white/70">
                {"/trade/reports/* (common candidates)"}
              </Badge>
            </div>
            {getResultValue("backendReportsDiscovery") ? (
              <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("backendReportsDiscovery"))}
              </pre>
            ) : null}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white/80">
                  16) Market data history (AUDJPY)
                </div>
                <div className="text-xs text-white/60">
                  Uses Trade endpoint: `/trade/history` with `tradableInstrumentId`.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(getResultValue("history"))}
                {copyButton("history")}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">instrumentId</Label>
                <Input
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  className="h-9 border-white/15 bg-transparent text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">resolution</Label>
                <Input
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="h-9 border-white/15 bg-transparent text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/60">lookbackDays</Label>
                <Input
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(e.target.value)}
                  className="h-9 border-white/15 bg-transparent text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="h-9 w-full bg-blue-600 text-white hover:bg-blue-700"
                  disabled={busy !== null}
                  onClick={() => void runTest("history")}
                >
                  {busy === "history" ? "Running…" : "Run"}
                </Button>
              </div>
            </div>

            {getResultValue("history") ? (
              <pre className="mt-3 max-h-[340px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                {stringify(getResultValue("history"))}
              </pre>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

