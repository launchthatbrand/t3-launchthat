"use client";

import React from "react";
import { useAction } from "convex/react";
import { api } from "@convex-config/_generated/api";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

type Resolution = "15m" | "1H" | "4H";

interface TradeLockerInstrumentRoute {
  id?: number;
  type?: string;
}

interface TradeLockerInstrumentLite {
  name?: string;
  description?: string;
  tradableInstrumentId?: number;
  routes?: TradeLockerInstrumentRoute[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const coerceInstrumentLiteArray = (
  value: unknown,
): TradeLockerInstrumentLite[] => {
  if (!Array.isArray(value)) return [];
  const out: TradeLockerInstrumentLite[] = [];

  for (const row of value) {
    if (!isRecord(row)) continue;
    const tradableInstrumentIdRaw = row.tradableInstrumentId;
    const tid = Number(tradableInstrumentIdRaw);
    if (!Number.isFinite(tid)) continue;

    const routesRaw = row.routes;
    const routes: TradeLockerInstrumentRoute[] = Array.isArray(routesRaw)
      ? routesRaw
          .filter((r): r is Record<string, unknown> => isRecord(r))
          .map((r) => ({
            id:
              typeof r.id === "number"
                ? r.id
                : typeof r.id === "string"
                  ? Number(r.id)
                  : undefined,
            type: typeof r.type === "string" ? r.type : undefined,
          }))
      : [];

    out.push({
      name: typeof row.name === "string" ? row.name : undefined,
      description:
        typeof row.description === "string" ? row.description : undefined,
      tradableInstrumentId: tid,
      routes,
    });
  }

  return out;
};

export function TradeLockerUserHistoryTest() {
  const probeInstruments = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerInstruments,
  );
  const probeHistory = useAction(
    api.traderlaunchpad.actions.probeMyTradeLockerHistoryForInstrument,
  );

  const [resolution, setResolution] = React.useState<Resolution>("1H");
  const [lookbackDays, setLookbackDays] = React.useState<number>(7);
  const [loadingInstruments, setLoadingInstruments] = React.useState(false);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [data, setData] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [instruments, setInstruments] = React.useState<
    TradeLockerInstrumentLite[]
  >([]);
  const [filter, setFilter] = React.useState("");
  const [selectedInstrumentId, setSelectedInstrumentId] =
    React.useState<string>("");

  const loadInstruments = async () => {
    setLoadingInstruments(true);
    setError(null);
    setData(null);
    try {
      const res: unknown = await probeInstruments({});
      const payload = isRecord(res) ? res : {};
      const listRaw = Array.isArray(payload.instruments)
        ? payload.instruments
        : payload.instrumentsPreview;
      const list = coerceInstrumentLiteArray(listRaw);
      setInstruments(list);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingInstruments(false);
    }
  };

  const selectedInstrument = React.useMemo(() => {
    const idNum = Number(selectedInstrumentId);
    if (!Number.isFinite(idNum)) return null;
    return (
      instruments.find((i) => Number(i.tradableInstrumentId) === idNum) ?? null
    );
  }, [instruments, selectedInstrumentId]);

  const selectedInfoRouteId = React.useMemo(() => {
    const routes = selectedInstrument?.routes ?? [];
    const info = routes.find(
      (r) => String(r.type ?? "").toLowerCase() === "info",
    );
    const id = Number(info?.id);
    return Number.isFinite(id) ? id : null;
  }, [selectedInstrument]);

  const filteredInstruments = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return instruments;
    return instruments.filter((i) => {
      const name = String(i.name ?? "").toLowerCase();
      const desc = String(i.description ?? "").toLowerCase();
      const tid = String(i.tradableInstrumentId ?? "");
      return (
        name.includes(q) || desc.includes(q) || tid.includes(q) || q.includes(name)
      );
    });
  }, [filter, instruments]);

  const fetchHistory = async () => {
    if (!selectedInstrumentId) {
      setError("Pick an instrument first.");
      return;
    }

    setLoadingHistory(true);
    setError(null);
    setData(null);
    try {
      const res: unknown = await probeHistory({
        tradableInstrumentId: selectedInstrumentId,
        routeId: selectedInfoRouteId ?? undefined,
        resolution,
        lookbackDays,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <Card className="border-white/10 bg-white/3 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Instrument history (user token)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-white/60">
          Load your account instruments, pick one, then fetch{" "}
          <span className="font-mono">/trade/history</span> using the instrument’s{" "}
          <span className="font-mono">INFO</span> route id (from{" "}
          <span className="font-mono">routes[]</span>).
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={loadInstruments}
            disabled={loadingInstruments}
          >
            {loadingInstruments ? "Loading..." : "Load instruments"}
          </Button>

          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter (EURUSD, US30, Gold, 17619...)"
            className="h-9 w-[min(380px,100%)]"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs text-white/60">Instrument</div>
            <Select
              value={selectedInstrumentId}
              onValueChange={setSelectedInstrumentId}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select instrument..." />
              </SelectTrigger>
              <SelectContent>
                {filteredInstruments.slice(0, 200).map((i) => {
                  const tid = Number(i.tradableInstrumentId);
                  if (!Number.isFinite(tid)) return null;
                  return (
                    <SelectItem key={tid} value={String(tid)}>
                      {String(i.name ?? "Unknown")} • #{tid}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedInstrument ? (
              <div className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-white/70">
                <div className="font-medium text-white/80">
                  {String(selectedInstrument.name ?? "Unknown")}
                </div>
                <div className="mt-0.5">
                  {String(selectedInstrument.description ?? "")}
                </div>
                <div className="mt-1 font-mono">
                  tradableInstrumentId={String(selectedInstrument.tradableInstrumentId ?? "")}{" "}
                  • infoRouteId={selectedInfoRouteId ?? "?"}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-white/60">Timeframe</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={resolution === "15m" ? "secondary" : "outline"}
                className="h-9"
                onClick={() => setResolution("15m")}
              >
                15m
              </Button>
              <Button
                type="button"
                variant={resolution === "1H" ? "secondary" : "outline"}
                className="h-9"
                onClick={() => setResolution("1H")}
              >
                1H
              </Button>
              <Button
                type="button"
                variant={resolution === "4H" ? "secondary" : "outline"}
                className="h-9"
                onClick={() => setResolution("4H")}
              >
                4H
              </Button>
              <Input
                type="number"
                min={1}
                max={30}
                value={String(lookbackDays)}
                onChange={(e) =>
                  setLookbackDays(
                    Math.max(1, Math.min(30, Number(e.target.value || 7))),
                  )
                }
                className="h-9 w-[110px]"
                placeholder="Days"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="h-9 border-0 bg-orange-600 text-white hover:bg-orange-700"
            onClick={fetchHistory}
            disabled={loadingHistory || !selectedInstrumentId}
          >
            {loadingHistory ? "Fetching..." : "Fetch history"}
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

