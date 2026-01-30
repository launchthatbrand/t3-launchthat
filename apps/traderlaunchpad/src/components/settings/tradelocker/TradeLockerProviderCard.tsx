"use client";

import React from "react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Plug } from "lucide-react";
import { TradeLockerAccountsList } from "./TradeLockerAccountsList";
import { TradeLockerConnectFlow } from "./TradeLockerConnectFlow";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@acme/ui/dialog";

export type TradeLockerProviderCardProps = {
  showAccounts?: boolean;
};

export function TradeLockerProviderCard(props: TradeLockerProviderCardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;
  const entitlements = useQuery(
    api.accessPolicy.getMyEntitlements,
    shouldQuery ? {} : "skip",
  ) as
    | {
        isSignedIn: boolean;
        features: { journal: boolean };
      }
    | undefined;
  const canUseJournal = Boolean(entitlements?.features?.journal);
  const data = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerConnection,
    shouldQuery && canUseJournal ? {} : "skip",
  );
  const disconnect = useAction(api.traderlaunchpad.actions.disconnectTradeLocker);
  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const refreshAccountConfig = useAction(
    api.traderlaunchpad.actions.refreshMyTradeLockerAccountConfig,
  );

  const [showConnect, setShowConnect] = React.useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = React.useState(false);
  const [deleteDataOnDisconnect, setDeleteDataOnDisconnect] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const connection = (data as any)?.connection as any | undefined;
  const accounts: Array<any> = Array.isArray((data as any)?.accounts)
    ? (data as any).accounts
    : [];

  const status: string =
    typeof connection?.status === "string" ? connection.status : "disconnected";
  const isConnected = status === "connected";

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await disconnect({ deleteData: deleteDataOnDisconnect });
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

  return (
    <Card className={isConnected ? "border-l-4 border-l-emerald-500 border-white/10 bg-black/20" : "border-l-4 border-l-white/10 border-white/10 bg-black/20"}>
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
            <CardDescription>Primary trading account connection.</CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10">
            <Plug className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="text-sm text-white/70">
              Not connected yet. Connect to start syncing your broker data.
            </div>
            <Button
              type="button"
              className="h-9 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => setShowConnect(true)}
            >
              Connect
            </Button>
          </div>
        ) : null}

        {props.showAccounts ? (
          <TradeLockerAccountsList
            accounts={accounts}
            selectedAccNum={
              typeof connection?.selectedAccNum === "number"
                ? connection.selectedAccNum
                : null
            }
            onRefreshStatus={handleRefreshConfigForRow}
          />
        ) : null}

        <Dialog open={showConnect} onOpenChange={setShowConnect}>
          <DialogContent
            className="max-w-xl"
            onInteractOutside={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onFocusOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <TradeLockerConnectFlow
              onCancel={() => setShowConnect(false)}
              onSuccess={() => setShowConnect(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <DialogContent
            className="max-w-lg"
            onInteractOutside={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onFocusOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Disconnect TradeLocker</DialogTitle>
              <DialogDescription>
                Disconnecting will stop syncs. You can optionally remove imported broker data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                <Checkbox
                  id="tl-delete-data"
                  checked={deleteDataOnDisconnect}
                  onCheckedChange={(v) => setDeleteDataOnDisconnect(Boolean(v))}
                />
                <label htmlFor="tl-delete-data" className="cursor-pointer">
                  Delete imported broker data (trades, orders, positions, account state).
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    await handleDisconnect();
                    setShowDisconnectDialog(false);
                  }}
                  disabled={disconnecting}
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            {error}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2 border-t border-white/10 px-6 py-4">
        <Button
          type="button"
          variant="outline"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => setShowDisconnectDialog(true)}
          disabled={!isConnected || disconnecting}
        >
          Disconnect
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSyncNow}
          disabled={!isConnected || syncing}
        >
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
      </CardFooter>
    </Card>
  );
}

