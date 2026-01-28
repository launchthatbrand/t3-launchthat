"use client";

import * as React from "react";
import Link from "next/link";
import { useAction } from "convex/react";
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

  const [sources, setSources] = React.useState<SourceRow[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = React.useState<unknown>(null);

  const [form, setForm] = React.useState({
    sourceKey: "",
    kind: "rss",
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

  const handleCreate = async () => {
    setError(null);
    setLastRunResult(null);
    if (!form.sourceKey.trim()) return setError("sourceKey is required");
    if (!form.url.trim()) return setError("url is required");
    setBusy(true);
    try {
      await createSource({
        sourceKey: form.sourceKey.trim(),
        kind: form.kind,
        label: form.label.trim() || undefined,
        cadenceSeconds: Number(form.cadenceSeconds),
        overlapSeconds: 300,
        enabled: true,
        config: { url: form.url.trim(), label: form.label.trim() || undefined },
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
            <Label>Kind</Label>
            <Select value={form.kind} onValueChange={(v) => setForm((s) => ({ ...s, kind: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss">RSS</SelectItem>
                <SelectItem value="economic_calendar_api">Economic calendar API (JSON)</SelectItem>
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

