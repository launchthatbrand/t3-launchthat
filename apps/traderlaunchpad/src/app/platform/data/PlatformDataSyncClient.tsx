"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Checkbox } from "@acme/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

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
  const setAccountEnabled = useMutation(
    api.platform.priceDataAccountPolicies.setAccountEnabledForPriceData,
  );
  const createRule = useMutation(api.platform.priceDataSyncRules.createSyncRule);
  const updateRule = useMutation(api.platform.priceDataSyncRules.updateSyncRule);
  const deleteRule = useMutation(api.platform.priceDataSyncRules.deleteSyncRule);
  const setRuleEnabled = useMutation(api.platform.priceDataSyncRules.setRuleEnabled);

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
  const [ruleBusy, setRuleBusy] = React.useState(false);
  const [ruleError, setRuleError] = React.useState<string | null>(null);

  const schedulerState = useQuery(api.platform.priceDataSyncStatus.getSchedulerState, {});

  const accountGroups = useQuery(api.platform.priceDataAccountPolicies.listAccountsBySourceKey, {
    sourceKey: sourceKey || undefined,
  });

  const syncRules = useQuery(api.platform.priceDataSyncRules.listSyncRules, {
    limit: 200,
    sourceKey: sourceKey || undefined,
  });

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
          <CardTitle>Sync admin</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="text-xs font-medium text-muted-foreground">Scheduler</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                lastTickAt: {typeof schedulerState?.lastTickAt === "number" ? schedulerState.lastTickAt : "—"}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                processed:{" "}
                {typeof schedulerState?.processedRulesLastTick === "number"
                  ? schedulerState.processedRulesLastTick
                  : "—"}
              </Badge>
            </div>
            {typeof schedulerState?.lastTickError === "string" ? (
              <div className="mt-2 text-xs text-red-600">{schedulerState.lastTickError}</div>
            ) : null}
          </div>

          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="text-xs font-medium text-muted-foreground">Selection</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {sourceKey || "Pick a broker/sourceKey"}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {tradableInstrumentId || "Pick an instrument"}
              </Badge>
              <Badge variant="secondary">{symbol || "—"}</Badge>
            </div>
          </div>

          <div className="rounded-md border px-3 py-2 text-sm">
            <div className="text-xs font-medium text-muted-foreground">Mode</div>
            <div className="mt-1 text-sm">Platform accounts only</div>
            <div className="mt-1 text-xs text-muted-foreground">
              User-assisted fetching/writes will be added as a policy later.
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="continuous">Continuous sync</TabsTrigger>
          <TabsTrigger value="backfill">Backfill</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform account pool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(accountGroups ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No platform TradeLocker connections found{sourceKey ? " for this broker." : "."}
                </div>
              ) : (
                <div className="space-y-4">
                  {(accountGroups ?? []).map((g) => (
                    <div key={`${g.connectionId}:${g.sourceKey}`} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {g.sourceKey}
                        </Badge>
                        <Badge variant="secondary">{g.connectionLabel}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {g.environment}
                        </Badge>
                      </div>

                      <div className="mt-3 rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Enabled</TableHead>
                              <TableHead>accNum</TableHead>
                              <TableHead>accountId</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last config</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {g.accounts.map((a: any) => (
                              <TableRow key={a.accountRowId}>
                                <TableCell className="w-[1%]">
                                  <Checkbox
                                    checked={a.enabledForPriceData}
                                    onCheckedChange={async (v) => {
                                      await setAccountEnabled({
                                        accountRowId: a.accountRowId,
                                        enabledForPriceData: Boolean(v),
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-xs">{a.accNum}</TableCell>
                                <TableCell className="font-mono text-xs">{a.accountId}</TableCell>
                                <TableCell className="text-xs">{a.name ?? "—"}</TableCell>
                                <TableCell className="text-xs">{a.status ?? "—"}</TableCell>
                                <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                                  {a.lastConfigOk === true
                                    ? "ok"
                                    : a.lastConfigOk === false
                                      ? a.lastConfigError ?? "error"
                                      : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="continuous" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Continuous sync rules (1m)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={ruleBusy}
                  onClick={async () => {
                    setRuleError(null);
                    if (!sourceKey.trim()) return setRuleError("Pick a broker/sourceKey first.");
                    if (!tradableInstrumentId.trim()) return setRuleError("Pick an instrument first.");
                    if (!symbol.trim()) return setRuleError("Missing symbol for the selected instrument.");
                    setRuleBusy(true);
                    try {
                      await createRule({ sourceKey, tradableInstrumentId, symbol });
                    } catch (e) {
                      setRuleError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setRuleBusy(false);
                    }
                  }}
                >
                  {ruleBusy ? "Adding…" : "Add rule for selected pair"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  Rules run via cron every minute; the runner uses enabled platform accounts per sourceKey.
                </div>
              </div>

              {ruleError ? <div className="text-sm text-red-600">{ruleError}</div> : null}

              {(syncRules ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No rules yet.</div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Pair</TableHead>
                        <TableHead className="text-right">Cadence (s)</TableHead>
                        <TableHead className="text-right">Overlap (s)</TableHead>
                        <TableHead className="text-right">Last ok</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(syncRules ?? []).map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="w-[1%]">
                            <Checkbox
                              checked={r.enabled}
                              onCheckedChange={async (v) => {
                                await setRuleEnabled({ ruleId: r._id, enabled: Boolean(v) });
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.sourceKey}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {r.tradableInstrumentId} · {r.symbol}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Input
                              className="h-8 w-24 text-right"
                              defaultValue={String(r.cadenceSeconds)}
                              onBlur={async (e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n)) {
                                  await updateRule({ ruleId: r._id, cadenceSeconds: n });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <Input
                              className="h-8 w-24 text-right"
                              defaultValue={String(r.overlapSeconds)}
                              onBlur={async (e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n)) {
                                  await updateRule({ ruleId: r._id, overlapSeconds: n });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {typeof r.lastOkAt === "number" ? r.lastOkAt : "—"}
                          </TableCell>
                          <TableCell className="max-w-[360px] truncate text-xs text-muted-foreground">
                            {r.lastError ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await deleteRule({ ruleId: r._id });
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backfill" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backfill settings</CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

