"use client";

import * as React from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Badge } from "@acme/ui/badge";

import type { EmailDomainStatus, EmailSettings, EmailSettingsPanelProps } from "./types";

export function EmailSettingsPanel(props: EmailSettingsPanelProps) {
  const orgId = props.orgId;
  const settings = useQuery(
    props.api.queries.getEmailSettings,
    orgId ? { orgId } : "skip",
  ) as EmailSettings | null | undefined;
  const domain = useQuery(
    props.api.queries.getEmailDomain,
    orgId ? { orgId } : "skip",
  ) as
    | {
        domain: string | null;
        status: EmailDomainStatus;
        records: Array<{ type: string; name: string; value: string }>;
        lastError?: string;
        updatedAt: number;
      }
    | null
    | undefined;

  const upsert = useMutation(props.api.mutations.upsertEmailSettings);
  const setEmailDomain = useMutation(props.api.mutations.setEmailDomain);
  const syncDomain = useAction(props.api.actions.syncEmailDomain);
  const sendTest = useMutation(props.api.mutations.enqueueTestEmail);

  const [draft, setDraft] = React.useState<EmailSettings>({
    enabled: false,
    fromName: "Trader Launchpad",
    fromMode: "portal",
    fromLocalPart: "info",
    replyToEmail: null,
    designKey: "clean",
  });
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [testTo, setTestTo] = React.useState("");
  const [domainDraft, setDomainDraft] = React.useState("");

  React.useEffect(() => {
    if (!settings) return;
    setDraft({
      enabled: Boolean(settings.enabled),
      fromName: settings.fromName ?? "Trader Launchpad",
      fromMode: settings.fromMode ?? "portal",
      fromLocalPart: settings.fromLocalPart ?? "info",
      replyToEmail: settings.replyToEmail ?? null,
      designKey: settings.designKey ?? "clean",
    });
  }, [settings]);

  React.useEffect(() => {
    setDomainDraft(domain?.domain ?? "");
  }, [domain?.domain]);

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select an organization first.
        </CardContent>
      </Card>
    );
  }

  const domainStatus = domain?.status ?? "unconfigured";
  const domainLabel = domain?.domain ?? "—";

  const handleSave = async () => {
    setBusy("save");
    setError(null);
    try {
      await upsert({
        orgId,
        enabled: draft.enabled,
        fromName: draft.fromName,
        fromMode: draft.fromMode,
        fromLocalPart: draft.fromLocalPart,
        replyToEmail: draft.replyToEmail ?? undefined,
        designKey: draft.designKey ?? undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSyncDomain = async () => {
    setBusy("sync");
    setError(null);
    try {
      await syncDomain({ orgId });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSaveDomain = async () => {
    setBusy("domain");
    setError(null);
    try {
      await setEmailDomain({ orgId, domain: domainDraft.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const handleSendTest = async () => {
    setBusy("test");
    setError(null);
    try {
      await sendTest({ orgId, to: testTo.trim() });
      setTestTo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Email</CardTitle>
          <Badge variant="outline">
            Domain: {domainLabel} • {domainStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 rounded-lg border p-3">
            <div>
              <div className="text-sm font-semibold">Email domain</div>
              <div className="text-xs text-muted-foreground">
                Used for custom sender addresses (requires verification).
              </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                placeholder="example.com"
                value={domainDraft}
                onChange={(e) => setDomainDraft(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDomain}
                disabled={busy !== null}
                className="md:w-[160px]"
              >
                {busy === "domain" ? "Saving…" : "Save domain"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <div className="text-sm font-semibold">Enable sending</div>
              <div className="text-xs text-muted-foreground">
                When off, emails will not be delivered.
              </div>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: Boolean(v) }))}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From name</Label>
              <Input
                value={draft.fromName}
                onChange={(e) => setDraft((d) => ({ ...d, fromName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reply-to email (optional)</Label>
              <Input
                value={draft.replyToEmail ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    replyToEmail: e.target.value.trim() ? e.target.value : null,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>From mode</Label>
              <Input
                value={draft.fromMode}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    fromMode: e.target.value === "custom" ? "custom" : "portal",
                  }))
                }
              />
              <div className="text-xs text-muted-foreground">
                Use \"portal\" or \"custom\" (custom requires verified domain).
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>From local-part</Label>
              <Input
                value={draft.fromLocalPart}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, fromLocalPart: e.target.value }))
                }
              />
              <div className="text-xs text-muted-foreground">
                Example: \"info\" becomes info@domain.com
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleSave} disabled={busy !== null}>
              {busy === "save" ? "Saving…" : "Save settings"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSyncDomain}
              disabled={busy !== null || !domainDraft.trim()}
            >
              {busy === "sync" ? "Syncing…" : "Sync email domain"}
            </Button>
          </div>

          {domain?.records?.length ? (
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-semibold">
                DNS records ({domain.records.length})
              </summary>
              <div className="mt-2 grid gap-2">
                {domain.records.map((r, idx) => (
                  <div key={`${r.type}:${idx}`} className="rounded-md border p-2 text-xs">
                    <div><span className="font-mono">{r.type}</span> {r.name}</div>
                    <div className="font-mono text-muted-foreground">{r.value}</div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          {domain?.lastError ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-200">
              {domain.lastError}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send test email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          </div>
          <Button type="button" onClick={handleSendTest} disabled={busy !== null || !testTo.trim()}>
            {busy === "test" ? "Sending…" : "Send test"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

