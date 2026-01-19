"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export function PriceDataSourceSetupCard() {
  const getDefault = useAction(api.traderlaunchpad.actions.getMyDefaultPriceDataSource);
  const setDefault = useAction(api.traderlaunchpad.actions.setDefaultPriceDataSourceFromMyTradeLocker);

  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRefresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: unknown = await getDefault({});
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [getDefault]);

  const handleSetDefault = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: unknown = await setDefault({});
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [setDefault]);

  React.useEffect(() => {
    void handleRefresh();
  }, [handleRefresh]);

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Price data source (default)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-white/60">
          Sets the default broker/source used for public symbol pages and shared cached bars.
          This uses your connected TradeLocker account as the seed identity.
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button
            type="button"
            className="h-9 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleSetDefault}
            disabled={loading}
          >
            Use my TradeLocker connection as default source
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            {error}
          </div>
        ) : null}

        {data ? (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-2 text-[11px] text-white/70">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}

