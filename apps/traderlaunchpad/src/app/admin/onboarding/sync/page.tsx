"use client";

import React from "react";
import Link from "next/link";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { ArrowRight, RefreshCw, ShieldAlert, Zap } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { cn } from "@acme/ui";

import { api } from "@convex-config/_generated/api";
import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";
import {
  FeatureAccessAlert,
  useGlobalPermissions,
} from "~/components/access/FeatureAccessGate";

const formatAge = (ms: number) => {
  const delta = Date.now() - ms;
  if (delta < 60_000) return "just now";
  const min = Math.floor(delta / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
};

export default function OnboardingSyncPage() {
  const status = useOnboardingStatus();
  const syncNow = useAction(api.traderlaunchpad.actions.syncMyTradeLockerNow);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { isAdmin } = useGlobalPermissions();
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
  const canUseJournal = Boolean(isAdmin) || Boolean(entitlements?.features?.journal);
  const connectionData = useQuery(
    api.traderlaunchpad.queries.getMyTradeLockerConnection,
    shouldQuery && canUseJournal ? {} : "skip",
  );

  if (!authLoading && !canUseJournal) {
    return (
      <div className="container py-6">
        <FeatureAccessAlert description="You do not have access to Journal features." />
      </div>
    );
  }

  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<unknown>(null);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const lastSyncAt =
    typeof connectionData?.polling?.lastSyncAt === "number"
      ? connectionData.polling.lastSyncAt
      : 0;

  const handleSyncNow = async () => {
    setLastError(null);
    setIsSyncing(true);
    try {
      const res = await syncNow({});
      setLastResult(res);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Step 2: Sync trades</span>
            {status.tradesOk ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                Imported
              </Badge>
            ) : (
              <Badge variant="outline">Not imported yet</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {!status.connectedOk ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                Connect required
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                You need to connect TradeLocker before syncing.
              </div>
              <div className="mt-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/onboarding/connect">Go to Connect</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-blue-500" />
                  What happens
                </div>
                <div className="text-muted-foreground mt-2 text-sm">
                  We import trades and group them into TradeIdeas for review + learning.
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Last sync</div>
                <div className="mt-1 text-lg font-semibold">
                  {lastSyncAt ? formatAge(lastSyncAt) : "—"}
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  Run a sync to pull your latest data.
                </div>
              </div>
              <div className="bg-muted/20 rounded-lg border p-4">
                <div className="text-muted-foreground text-xs">Status</div>
                <div className="mt-1 text-lg font-semibold">
                  {isSyncing ? "Syncing…" : status.syncOk ? "Healthy" : "Needs sync"}
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  You’ll see Trades imported once we detect closed TradeIdeas.
                </div>
              </div>
            </div>
          )}

          {lastError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm">
              <div className="font-semibold text-red-500">Sync error</div>
              <div className="text-muted-foreground mt-1">{lastError}</div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Import your trades</div>
              <div className="text-muted-foreground text-sm">
                Run sync now. You can review your first TradeIdea right after.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSyncNow}
                disabled={!status.connectedOk || isSyncing}
                className={cn("gap-2", isSyncing ? "opacity-80" : "")}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing ? "animate-spin" : "")} />
                Sync now
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                asChild
                disabled={!status.tradesOk}
              >
                <Link href="/admin/onboarding/first-review">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {lastResult ? (
            <div className="text-muted-foreground text-xs">
              Last sync result captured (dev): {JSON.stringify(lastResult).slice(0, 180)}…
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

