"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export function TradeLockerUserAllAccountsTest() {
  const probe = useAction(api.traderlaunchpad.actions.probeMyTradeLockerAllAccounts);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res: unknown = await probe({});
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">All accounts (user token)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-white/60">
          Fetches <span className="font-mono">/auth/jwt/all-accounts</span> using
          your stored TradeLocker JWT (and refreshes it on 401/403). This is the
          source of truth for <span className="font-mono">accountId</span> /{" "}
          <span className="font-mono">accNum</span> mapping.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? "Fetching..." : "Fetch all accounts"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            {error}
          </div>
        ) : null}

        {data ? (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-2 text-[11px] text-white/70">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

