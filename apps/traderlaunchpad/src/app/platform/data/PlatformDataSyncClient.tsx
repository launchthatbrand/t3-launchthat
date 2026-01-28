"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";

import { usePlatformPriceDataStore } from "~/stores/platformPriceDataStore";

type JobStatus = "queued" | "running" | "done" | "error";

const jobBadgeVariant = (s: JobStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "done") return "secondary";
  if (s === "error") return "destructive";
  if (s === "running") return "default";
  return "outline";
};

export const PlatformDataSyncClient = () => {
  const startJob = useMutation(api.platform.priceDataJobs.startBackfillJob1m);

  const sourceKey = usePlatformPriceDataStore((s) => s.sourceKey);
  const tradableInstrumentId = usePlatformPriceDataStore((s) => s.tradableInstrumentId);
  const symbol = usePlatformPriceDataStore((s) => s.symbol);

  const lookback = usePlatformPriceDataStore((s) => s.lookback);
  const setLookback = usePlatformPriceDataStore((s) => s.setLookback);
  const overlapDays = usePlatformPriceDataStore((s) => s.overlapDays);
  const setOverlapDays = usePlatformPriceDataStore((s) => s.setOverlapDays);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);

  const jobs = useQuery(
    api.platform.priceDataJobs.listJobs,
    sourceKey && tradableInstrumentId
      ? { limit: 25, sourceKey, tradableInstrumentId }
      : { limit: 25 },
  );

  const activeJob = React.useMemo(() => {
    if (!activeJobId) return null;
    return (jobs ?? []).find((j) => String(j._id) === activeJobId) ?? null;
  }, [activeJobId, jobs]);

  const handleStartJob = async () => {
    setError(null);
    if (!sourceKey.trim()) return setError("Pick a broker/sourceKey first.");
    if (!tradableInstrumentId.trim()) return setError("Pick an instrument first.");
    if (!symbol.trim()) return setError("Missing symbol for the selected instrument.");

    const overlap = Number(overlapDays);
    if (!Number.isFinite(overlap) || overlap < 0 || overlap > 7) {
      return setError("Overlap days must be a number between 0 and 7.");
    }

    setBusy(true);
    try {
      await startJob({
        sourceKey,
        tradableInstrumentId,
        symbol,
        requestedLookbackDays: lookback,
        overlapDays: overlap,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Lookback</Label>
              <Select
                value={String(lookback)}
                onValueChange={(v) => setLookback(Number(v) as 1 | 3 | 7 | 14 | 30 | 60 | 90)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Overlap days</Label>
              <Input value={overlapDays} onChange={(e) => setOverlapDays(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Selected</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {sourceKey && tradableInstrumentId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {sourceKey}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {tradableInstrumentId}
                    </Badge>
                    <Badge variant="secondary">{symbol || "—"}</Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Pick a broker + instrument above.</span>
                )}
              </div>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center gap-2">
            <Button onClick={handleStartJob} disabled={busy}>
              {busy ? "Starting…" : "Start backfill (1m)"}
            </Button>
            <div className="text-muted-foreground text-sm">
              Incremental backfill: longer lookbacks fetch only missing older slices (with overlap).
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(jobs ?? []).length === 0 ? (
            <div className="text-muted-foreground text-sm">No jobs yet.</div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Lookback</TableHead>
                    <TableHead className="text-right">Overlap</TableHead>
                    <TableHead className="text-right">Inserted</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(jobs ?? []).map((j) => {
                    const inserted =
                      typeof (j.progress as any)?.insertedRowsDelta === "number"
                        ? (j.progress as any).insertedRowsDelta
                        : undefined;
                    const err =
                      typeof (j as any).error === "string" ? ((j as any).error as string) : "";
                    const errPreview =
                      err.length > 0 ? (err.length > 80 ? `${err.slice(0, 80)}…` : err) : "";
                    return (
                      <TableRow key={j._id}>
                        <TableCell className="w-[1%]">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveJobId(String(j._id))}
                          >
                            View
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={jobBadgeVariant(j.status as JobStatus)}>{j.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{j.sourceKey}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {j.tradableInstrumentId} · {j.symbol}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {j.requestedLookbackDays}d
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{j.overlapDays}d</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {inserted !== undefined ? inserted.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                          {errPreview || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <Separator />
          <div className="text-muted-foreground text-sm">
            For runner logs, open the <span className="font-medium text-foreground">Logs</span> tab.
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeJobId)} onOpenChange={(open) => (open ? null : setActiveJobId(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job details</DialogTitle>
          </DialogHeader>
          {!activeJob ? (
            <div className="text-muted-foreground text-sm">Job not found.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={jobBadgeVariant(activeJob.status as JobStatus)}>{activeJob.status}</Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {String(activeJob._id)}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeJob.sourceKey}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeJob.tradableInstrumentId}
                </Badge>
                <Badge variant="secondary">{activeJob.symbol}</Badge>
              </div>

              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-medium">Computed window:</span>{" "}
                  <span className="font-mono text-xs">
                    {(activeJob as any).computedFromTs ?? "—"} → {(activeJob as any).computedToTs ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Workflow:</span>{" "}
                  <span className="font-mono text-xs">{(activeJob as any).workflowId ?? "—"}</span>
                </div>
              </div>

              {(activeJob as any).error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
                  <div className="text-sm font-medium text-red-700 dark:text-red-200">Error</div>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-red-700/90 dark:text-red-200/90">
                    {String((activeJob as any).error)}
                  </pre>
                </div>
              ) : null}

              <div>
                <div className="text-sm font-medium">Progress</div>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {JSON.stringify((activeJob as any).progress ?? null, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

