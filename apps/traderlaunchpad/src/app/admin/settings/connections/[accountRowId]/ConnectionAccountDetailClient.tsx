"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useAction, useConvexAuth, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import React from "react";
import { RefreshCw } from "lucide-react";
import { TradeLockerApiDebugPanel } from "~/components/settings/tradelocker/TradeLockerApiDebugPanel";
import { api } from "@convex-config/_generated/api";

type UnknownRecord = Record<string, unknown>;
interface ConnectionAccountResult {
    provider: string;
    connection: UnknownRecord;
    account: UnknownRecord;
}

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === "object" && value !== null;

const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

export function ConnectionAccountDetailClient(props: { accountRowId: string }) {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const shouldQuery = isAuthenticated && !authLoading;
    const dataRaw: unknown = useQuery(
        api.traderlaunchpad.queries.getMyConnectionAccountById,
        shouldQuery ? { accountRowId: props.accountRowId } : "skip",
    );

    const disconnect = useAction(api.traderlaunchpad.actions.disconnectTradeLocker);
    const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
    const refreshAccountConfig = useAction(
        api.traderlaunchpad.actions.refreshMyTradeLockerAccountConfig,
    );

    const [busy, setBusy] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const data: ConnectionAccountResult | null | undefined = (() => {
        if (dataRaw === undefined) return undefined;
        if (dataRaw === null) return null;
        if (!isRecord(dataRaw)) return null;

        const provider =
            typeof dataRaw.provider === "string" ? dataRaw.provider : "unknown";
        const connection = isRecord(dataRaw.connection) ? dataRaw.connection : {};
        const account = isRecord(dataRaw.account) ? dataRaw.account : {};

        return { provider, connection, account };
    })();

    if (data === undefined) {
        return (
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-sm text-muted-foreground">
                Loading…
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-sm text-muted-foreground">
                Account not found (or no access).
            </div>
        );
    }

    const provider = data.provider;
    const connection = data.connection;
    const account = data.account;

    const accountAccNum = toNumber(account.accNum);
    const selectedAccNum = toNumber(connection.selectedAccNum);

    const isActive =
        accountAccNum !== null &&
        selectedAccNum !== null &&
        accountAccNum === selectedAccNum;

    const customerAccess = isRecord(account.customerAccess)
        ? account.customerAccess
        : null;
    const hasMarket =
        typeof customerAccess?.symbolInfo === "boolean"
            ? Boolean(customerAccess.symbolInfo)
            : null;

    const handleDisconnect = async () => {
        setBusy("disconnect");
        setError(null);
        try {
            await disconnect({});
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(null);
        }
    };

    const handleSyncNow = async () => {
        setBusy("sync");
        setError(null);
        try {
            await syncNow({});
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(null);
        }
    };

    const handleRefreshStatus = async () => {
        setBusy("refresh");
        setError(null);
        try {
            const rowId =
                typeof account._id === "string" && account._id
                    ? account._id
                    : props.accountRowId;
            const accNum = toNumber(account.accNum) ?? 0;

            await refreshAccountConfig({
                accountRowId: rowId,
                accNum,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-border/40 bg-card/50">
                <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-foreground/90">
                            {provider === "tradelocker"
                                ? "TradeLocker"
                                : provider === "unknown"
                                    ? "Connection"
                                    : provider}
                        </CardTitle>
                        {isActive ? (
                            <Badge className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 dark:text-blue-200">
                                Active
                            </Badge>
                        ) : null}
                        {hasMarket === true ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200">
                                Market OK
                            </Badge>
                        ) : hasMarket === false ? (
                            <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-200">
                                Blocked
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-background/40 text-muted-foreground">
                                Unknown
                            </Badge>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {typeof account.name === "string" && account.name.trim()
                            ? account.name
                            : `Account ${accountAccNum ?? "—"}`}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 rounded-lg border border-border/40 bg-background/40 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">accNum</span>
                            <span className="font-mono text-foreground/80">
                                {accountAccNum ?? "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">accountId</span>
                            <span className="font-mono text-foreground/80">
                                {typeof account.accountId === "string" ? account.accountId : "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">rowId</span>
                            <span className="font-mono text-foreground/80">
                                {typeof account._id === "string" ? account._id : "—"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            onClick={handleRefreshStatus}
                            disabled={busy !== null}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {busy === "refresh" ? "Refreshing…" : "Refresh status"}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-9"
                            onClick={handleSyncNow}
                            disabled={busy !== null}
                        >
                            {busy === "sync" ? "Syncing…" : "Sync now"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                            onClick={handleDisconnect}
                            disabled={busy !== null}
                        >
                            {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
                        </Button>
                    </div>

                    {error ? (
                        <div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm text-red-600 dark:text-rose-200">
                            {error}
                        </div>
                    ) : null}

                    <details className="rounded-lg border border-border/40 bg-background/40 p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-foreground/70 hover:text-foreground">
                            Debug
                        </summary>
                        <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-border/40 bg-background/40 p-3 text-[11px] text-foreground/80">
                            {JSON.stringify({ connection, account }, null, 2)}
                        </pre>
                    </details>
                </CardContent>
            </Card>

            {provider === "tradelocker" ? (
                <TradeLockerApiDebugPanel accountRowId={props.accountRowId} />
            ) : null}
        </div>
    );
}

