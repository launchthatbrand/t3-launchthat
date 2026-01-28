"use client";

import * as React from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/ui/table";

interface AliasRow {
  alias: string;
  symbol: string;
}

interface SourceRow {
  _id: string;
  sourceKey: string;
  kind: string;
  label?: string;
  enabled: boolean;
  cadenceSeconds: number;
  overlapSeconds: number;
  nextRunAt: number;
  config: unknown;
}

export default function PlatformNewsSyncClient() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const listSources = useAction(api.platform.newsAdmin.listSources);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const createSource = useAction(api.platform.newsAdmin.createSource);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const updateSource = useAction(api.platform.newsAdmin.updateSource);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const runNow = useAction(api.platform.newsAdmin.runSourceNow);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const reprocessNow = useAction(api.platform.newsAdmin.reprocessSourceNow);

  const supportedSymbols = useQuery(api.platform.newsSymbolUniverse.listSupportedSymbols, {
    limitPerSource: 20000,
  });
  const parsingSettings = useQuery(api.platform.newsParsingSettings.getNewsParsingSettings, {});
  const upsertSettings = useMutation(api.platform.newsParsingSettings.upsertNewsParsingSettings);
  const resetSettings = useMutation(
    api.platform.newsParsingSettings.resetNewsParsingSettingsToDefaults,
  );

  const [sources, setSources] = React.useState<SourceRow[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = React.useState<unknown>(null);

  const [settingsBusy, setSettingsBusy] = React.useState(false);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [aliases, setAliases] = React.useState<AliasRow[]>([]);

  const [form, setForm] = React.useState({
    sourceKey: "",
    feedType: "rss_headlines" as "rss_headlines" | "rss_economic",
    label: "",
    url: "",
    cadenceSeconds: 600,
  });

  const refresh = React.useCallback(async () => {
    try {
      const rows = (await listSources({ limit: 200 })) as unknown;
      setSources(Array.isArray(rows) ? (rows as SourceRow[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sources");
    }
  }, [listSources]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    const map = parsingSettings?.assetAliasMap ?? null;
    if (!map || typeof map !== "object") return;
    const rows: AliasRow[] = [];
    for (const [alias, symbol] of Object.entries(map)) {
      rows.push({ alias: String(alias), symbol: String(symbol) });
    }
    rows.sort((a, b) => a.alias.localeCompare(b.alias));
    setAliases(rows);
  }, [parsingSettings?.assetAliasMap]);

  const handleCreate = async () => {
    setError(null);
    setLastRunResult(null);
    if (!form.sourceKey.trim()) return setError("sourceKey is required");
    if (!form.url.trim()) return setError("url is required");
    setBusy(true);
    try {
      const eventTypeHint = form.feedType === "rss_economic" ? "economic" : "headline";
      await createSource({
        sourceKey: form.sourceKey.trim(),
        kind: "rss",
        label: form.label.trim() || undefined,
        cadenceSeconds: Number(form.cadenceSeconds),
        overlapSeconds: 300,
        enabled: true,
        config: {
          url: form.url.trim(),
          label: form.label.trim() || undefined,
          eventTypeHint,
        },
      });
      setForm((s) => ({ ...s, sourceKey: "", label: "", url: "" }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create source");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">News sync</div>
          <div className="text-sm text-muted-foreground">
            Manage ingestion sources and run them on demand.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/platform/news/logs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View logs
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New source</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Feed type</Label>
            <Select
              value={form.feedType}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, feedType: v as "rss_headlines" | "rss_economic" }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss_headlines">RSS — Headlines</SelectItem>
                <SelectItem value="rss_economic">RSS — Economic calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>sourceKey</Label>
            <Input
              value={form.sourceKey}
              onChange={(e) => setForm((s) => ({ ...s, sourceKey: e.target.value }))}
              placeholder="e.g. forexfactory"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>URL</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label>Label (optional)</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
              placeholder="Human label"
            />
          </div>
          <div className="grid gap-2">
            <Label>Cadence (seconds)</Label>
            <Input
              inputMode="numeric"
              value={String(form.cadenceSeconds)}
              onChange={(e) =>
                setForm((s) => ({ ...s, cadenceSeconds: Number(e.target.value || 0) }))
              }
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            {error ? <div className="text-sm text-red-600">{error}</div> : <div />}
            <Button type="button" onClick={handleCreate} disabled={busy}>
              {busy ? "Creating..." : "Add source"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Parsing settings</CardTitle>
            <div className="text-xs text-muted-foreground">
              Deterministic alias mapping for asset-name mentions (e.g. Bitcoin → BTCUSD).
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={settingsBusy}
              onClick={() =>
                void (async () => {
                  setSettingsError(null);
                  setSettingsBusy(true);
                  try {
                    await resetSettings({});
                  } catch (e) {
                    setSettingsError(e instanceof Error ? e.message : "Failed to reset");
                  } finally {
                    setSettingsBusy(false);
                  }
                })()
              }
            >
              Reset to defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsError ? <div className="text-sm text-red-600">{settingsError}</div> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              supportedSymbols: {supportedSymbols ? supportedSymbols.length : "…"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              updatedAt:{" "}
              {typeof parsingSettings?.updatedAt === "number" && parsingSettings.updatedAt > 0
                ? new Date(parsingSettings.updatedAt).toLocaleString()
                : "—"}
            </Badge>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-60">Alias</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliases.map((row, idx) => (
                  <TableRow key={`${row.alias}:${idx}`}>
                    <TableCell>
                      <Input
                        value={row.alias}
                        className="h-9 font-mono text-xs"
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setAliases((prev) => {
                            const next = prev.slice();
                            next[idx] = { ...next[idx]!, alias: v };
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.symbol}
                        className="h-9 font-mono text-xs"
                        placeholder="e.g. BTCUSD"
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setAliases((prev) => {
                            const next = prev.slice();
                            next[idx] = { ...next[idx]!, symbol: v };
                            return next;
                          });
                        }}
                      />
                      {supportedSymbols && row.symbol && !supportedSymbols.includes(row.symbol) ? (
                        <div className="mt-1 text-[11px] text-red-600">
                          Symbol not in pricedata universe
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAliases((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {aliases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-6 text-sm text-muted-foreground">
                      No aliases configured.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAliases((prev) => [{ alias: "", symbol: "" }, ...prev])}
            >
              Add alias
            </Button>
            <Button
              type="button"
              disabled={settingsBusy}
              onClick={() =>
                void (async () => {
                  setSettingsError(null);
                  setSettingsBusy(true);
                  try {
                    const map: Record<string, string> = {};
                    for (const r of aliases) {
                      const a = r.alias.trim().toUpperCase();
                      const s = r.symbol.trim().toUpperCase();
                      if (!a || !s) continue;
                      map[a] = s;
                    }
                    await upsertSettings({ assetAliasMap: map, disabledAliases: [] });
                  } catch (e) {
                    setSettingsError(e instanceof Error ? e.message : "Failed to save settings");
                  } finally {
                    setSettingsBusy(false);
                  }
                })()
              }
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>sourceKey</TableHead>
                <TableHead>kind</TableHead>
                <TableHead>enabled</TableHead>
                <TableHead>cadence</TableHead>
                <TableHead className="text-right">actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={String(s._id)}>
                  <TableCell className="font-mono text-xs">{s.sourceKey}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.kind}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(s.enabled)}
                      onCheckedChange={(checked) =>
                        void (async () => {
                          try {
                            await updateSource({ sourceId: s._id, enabled: Boolean(checked) });
                            await refresh();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Failed to update");
                          }
                        })()
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.cadenceSeconds}s</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void (async () => {
                            setError(null);
                            setBusy(true);
                            setLastRunResult(null);
                            try {
                              const res = await runNow({ sourceId: s._id });
                              setLastRunResult(res);
                              await refresh();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Failed to run");
                            } finally {
                              setBusy(false);
                            }
                          })()
                        }
                      >
                        Run now
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          void (async () => {
                            setError(null);
                            setBusy(true);
                            setLastRunResult(null);
                            try {
                              const res = await reprocessNow({
                                sourceId: s._id,
                                lookbackDays: 30,
                                limit: 1000,
                              });
                              setLastRunResult(res);
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Failed to reprocess");
                            } finally {
                              setBusy(false);
                            }
                          })()
                        }
                      >
                        Reprocess
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-6 text-sm text-muted-foreground">
                    No sources configured yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {lastRunResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Last run result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs">
              {JSON.stringify(lastRunResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

