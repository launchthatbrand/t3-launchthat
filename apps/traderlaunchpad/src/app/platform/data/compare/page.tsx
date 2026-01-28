"use client";

import * as React from "react";
import { useAction } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";

export default function PlatformDataComparePage() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const compareBrokersForSymbol1m = useAction(api.platform.clickhouseData.compareBrokersForSymbol1m) as (
    args: { symbol: string; limit?: number },
  ) => Promise<
    {
      sourceKey: string;
      tradableInstrumentId: string;
      minTs?: string;
      maxTs?: string;
      rows_24h: number;
    }[]
  >;
  const [compareSymbol, setCompareSymbol] = React.useState<string>("");
  const [compare, setCompare] = React.useState<
    {
      sourceKey: string;
      tradableInstrumentId: string;
      minTs?: string;
      maxTs?: string;
      rows_24h: number;
    }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const sym = compareSymbol.trim().toUpperCase();
    if (!sym) {
      setCompare([]);
      return;
    }

    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      compareBrokersForSymbol1m({ symbol: sym, limit: 200 })
        .then((rows) => {
          if (cancelled) return;
          setCompare(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to compare brokers");
          setCompare([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [compareBrokersForSymbol1m, compareSymbol]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare brokers by symbol (1m)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Symbol</Label>
          <Input
            placeholder="BTCUSD"
            value={compareSymbol}
            onChange={(e) => setCompareSymbol(e.target.value)}
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        {compareSymbol.trim() && compare.length === 0 && !loading ? (
          <div className="text-muted-foreground text-sm">No results.</div>
        ) : null}

        {compare.length > 0 ? (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>sourceKey</TableHead>
                  <TableHead>tradableInstrumentId</TableHead>
                  <TableHead>min</TableHead>
                  <TableHead>max</TableHead>
                  <TableHead className="text-right">rows (24h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compare.map((r) => (
                  <TableRow key={r.sourceKey}>
                    <TableCell className="font-mono text-xs">{r.sourceKey}</TableCell>
                    <TableCell className="font-mono text-xs">{r.tradableInstrumentId}</TableCell>
                    <TableCell className="text-xs">{r.minTs ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.maxTs ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.rows_24h.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            {loading ? "Loading…" : "Enter a symbol to compare coverage across brokers."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

