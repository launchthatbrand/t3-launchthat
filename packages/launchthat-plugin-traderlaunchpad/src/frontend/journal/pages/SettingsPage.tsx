"use client";

import React from "react";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { TraderLaunchpadApiAdapter } from "../TraderLaunchpadAccountTab";

type TradeLockerEnv = "demo" | "live";

export function TraderLaunchpadSettingsPage(props: { api: TraderLaunchpadApiAdapter }) {
  const tlQueries = props.api.queries;
  const tlActions = props.api.actions;

  const connectionData = useQuery(tlQueries.getMyTradeLockerConnection, {}) as
    | {
        connection: any;
        polling: any;
      }
    | null
    | undefined;

  const myJournalProfile = useQuery(tlQueries.getMyJournalProfile, {}) as
    | { isPublic: boolean }
    | undefined;

  const accountState = useQuery(tlQueries.getMyTradeLockerAccountState, {}) as
    | { raw: any }
    | null
    | undefined;

  const startConnect = useAction(tlActions.startTradeLockerConnect);
  const finishConnect = useAction(tlActions.connectTradeLocker);
  const disconnect = useAction(tlActions.disconnectTradeLocker);
  const syncNow = useAction(tlActions.syncMyTradeLockerNow);
  const setMyJournalPublic = useAction(tlActions.setMyJournalPublic);

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
        if (typeof (a0 as any).accountId === "string") {
          setSelectedAccountId((a0 as any).accountId);
        }
        if (typeof (a0 as any).accNum === "number") {
          setSelectedAccNum((a0 as any).accNum);
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

  return (
    <div className="space-y-4">
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
                      onValueChange={(v) => setSelectedAccountId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>
                      <SelectContent>
                        {draft.accounts.map((a, idx) => {
                          const id = String((a as any)?.accountId ?? "");
                          const label =
                            String((a as any)?.name ?? "") ||
                            String((a as any)?.accountId ?? "") ||
                            `Account ${idx + 1}`;
                          return (
                            <SelectItem key={id || String(idx)} value={id || `unknown-${idx}`}>
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
    </div>
  );
}
