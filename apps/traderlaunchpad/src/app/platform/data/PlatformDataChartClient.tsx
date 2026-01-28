"use client";

import * as React from "react";
import { useAction } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { TradingChartReal, type RealBar } from "~/components/charts/TradingChartReal";
import { usePlatformPriceDataStore } from "~/stores/platformPriceDataStore";

export const PlatformDataChartClient = () => {
  const listCandles = useAction(api.platform.clickhouseCandles.listCandles1m);
  const getCoverageSummary1m = useAction(api.platform.clickhouseData.getCoverageSummary1m);

  const sourceKey = usePlatformPriceDataStore((s) => s.sourceKey);
  const tradableInstrumentId = usePlatformPriceDataStore((s) => s.tradableInstrumentId);

  const resolution = usePlatformPriceDataStore((s) => s.resolution);
  const setResolution = usePlatformPriceDataStore((s) => s.setResolution);

  const chartLookback = usePlatformPriceDataStore((s) => s.chartLookback);
  const setChartLookback = usePlatformPriceDataStore((s) => s.setChartLookback);

  const [bars, setBars] = React.useState<RealBar[]>([]);
  const [loadingBars, setLoadingBars] = React.useState(false);
  const [barsError, setBarsError] = React.useState<string | null>(null);

  const [coverage, setCoverage] = React.useState<{
    minTs?: string;
    maxTs?: string;
    rows: number;
    expectedRows: number;
    missingEstimate: number;
  } | null>(null);
  const [loadingCoverage, setLoadingCoverage] = React.useState(false);

  const fetchChart = React.useCallback(() => {
    if (!sourceKey || !tradableInstrumentId) return;
    const toMs = Date.now();
    const fromMs = toMs - chartLookback * 24 * 60 * 60 * 1000;
    setLoadingBars(true);
    setBarsError(null);
    listCandles({
      sourceKey,
      tradableInstrumentId,
      resolution,
      fromMs,
      toMs,
      limit: 5000,
    })
      .then((rows) => setBars(rows))
      .catch((e) => {
        setBars([]);
        setBarsError(e instanceof Error ? e.message : "Failed to load candles");
      })
      .finally(() => setLoadingBars(false));
  }, [chartLookback, listCandles, resolution, sourceKey, tradableInstrumentId]);

  React.useEffect(() => {
    if (!sourceKey || !tradableInstrumentId) {
      setBars([]);
      setCoverage(null);
      return;
    }

    let cancelled = false;

    // Chart
    setLoadingBars(true);
    setBarsError(null);
    const t = setTimeout(() => {
      const toMs = Date.now();
      const fromMs = toMs - chartLookback * 24 * 60 * 60 * 1000;
      listCandles({
        sourceKey,
        tradableInstrumentId,
        resolution,
        fromMs,
        toMs,
        limit: 5000,
      })
        .then((rows) => {
          if (cancelled) return;
          setBars(rows);
        })
        .catch((e) => {
          if (cancelled) return;
          setBars([]);
          setBarsError(e instanceof Error ? e.message : "Failed to load candles");
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingBars(false);
        });
    }, 250);

    // Coverage (still 1m for now; backfill targets 1m)
    setLoadingCoverage(true);
    getCoverageSummary1m({ sourceKey, tradableInstrumentId })
      .then((row) => {
        if (cancelled) return;
        setCoverage(row);
      })
      .catch(() => {
        if (cancelled) return;
        setCoverage(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingCoverage(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    chartLookback,
    getCoverageSummary1m,
    listCandles,
    resolution,
    sourceKey,
    tradableInstrumentId,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Trading chart</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1m</SelectItem>
                  <SelectItem value="5m">5m</SelectItem>
                  <SelectItem value="15m">15m</SelectItem>
                  <SelectItem value="30m">30m</SelectItem>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="4h">4h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(chartLookback)}
                onValueChange={(v) => setChartLookback(Number(v) as 1 | 3 | 7 | 14)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={fetchChart}
                disabled={!sourceKey || !tradableInstrumentId || loadingBars}
              >
                {loadingBars ? "Loading…" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!sourceKey || !tradableInstrumentId ? (
              <div className="text-muted-foreground text-sm">
                Select a broker + instrument to render the chart.
              </div>
            ) : barsError ? (
              <div className="text-sm text-red-600">{barsError}</div>
            ) : bars.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                {loadingBars ? "Loading candles…" : "No candles found for the selected range."}
              </div>
            ) : (
              <TradingChartReal bars={bars} className="w-full" height={420} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage summary (1m)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!coverage ? (
              <div className="text-muted-foreground text-sm">
                {loadingCoverage ? "Loading…" : "Select a broker + instrument to see coverage."}
              </div>
            ) : (
              <div className="grid gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">rows: {coverage.rows.toLocaleString()}</Badge>
                  <Badge variant="outline">expected: {coverage.expectedRows.toLocaleString()}</Badge>
                  <Badge variant="outline">
                    missing est: {coverage.missingEstimate.toLocaleString()}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">min:</span>{" "}
                    {coverage.minTs ?? "—"}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">max:</span>{" "}
                    {coverage.maxTs ?? "—"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

