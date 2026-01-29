"use client";

import "tdrlp-widgets";

import * as React from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import type { Id } from "@convex-config/_generated/dataModel";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

import { useTdrLpWidgetTheme } from "~/components/widgets/useTdrLpWidgetTheme";

type WidgetType = "profileCard" | "equityCurve" | "journalMetrics" | "myTrades" | "openPositions";

type Entitlements = {
  isSignedIn: boolean;
  tier: "free" | "standard" | "pro";
  features: { analytics: boolean; journal: boolean; strategies: boolean; orders: boolean };
};

type InstallationRow = {
  _id: Id<"widgetInstallations">;
  widgetType: WidgetType;
  enabled: boolean;
  displayName?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
};

const widgetLabel = (t: WidgetType) => {
  if (t === "profileCard") return "Profile card (metrics)";
  if (t === "myTrades") return "My trades";
  if (t === "openPositions") return "Open positions";
  if (t === "equityCurve") return "Equity curve";
  return "Journal metrics";
};

const widgetElementTag = (t: WidgetType): "tdrlp-profile-card" | "tdrlp-my-trades" | "tdrlp-open-positions" => {
  if (t === "myTrades") return "tdrlp-my-trades";
  if (t === "openPositions") return "tdrlp-open-positions";
  return "tdrlp-profile-card";
};

const isProWidget = (t: WidgetType) => t === "openPositions" || t === "myTrades";

export default function AdminSettingsWidgetsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const entitlements = useQuery(
    api.accessPolicy.getMyEntitlements,
    shouldQuery ? {} : "skip",
  ) as Entitlements | undefined;

  const tier = entitlements?.tier ?? "free";
  const isPro = tier === "pro";

  const installations = useQuery(
    api.widgets.installations.listMyWidgetInstallations,
    shouldQuery ? {} : "skip",
  ) as InstallationRow[] | undefined;

  const setEnabled = useMutation(api.widgets.installations.setMyWidgetInstallationEnabled);
  const deleteInstallation = useMutation(api.widgets.installations.deleteMyWidgetInstallation);

  const createInstallation = useAction(api.widgets.installations.createMyWidgetInstallation) as (args: {
    widgetType: WidgetType;
    displayName?: string;
    config?: unknown;
  }) => Promise<{ installationId: Id<"widgetInstallations">; apiKey: string }>;

  const rotateKey = useAction(api.widgets.installations.rotateMyWidgetInstallationKey) as (args: {
    installationId: Id<"widgetInstallations">;
  }) => Promise<{ apiKey: string }>;

  const { widgetStyle } = useTdrLpWidgetTheme();

  const [createType, setCreateType] = React.useState<WidgetType>("profileCard");
  const [displayName, setDisplayName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const [revealOpen, setRevealOpen] = React.useState(false);
  const [revealKind, setRevealKind] = React.useState<WidgetType>("profileCard");
  const [revealInstallationId, setRevealInstallationId] = React.useState<string>("");
  const [revealApiKey, setRevealApiKey] = React.useState<string>("");
  const [embedKind, setEmbedKind] = React.useState<"html" | "react">("html");
  const [copied, setCopied] = React.useState(false);

  const [widgetHost, setWidgetHost] = React.useState("https://traderlaunchpad.com");
  const [apiBase, setApiBase] = React.useState("https://different-trout-684.convex.site");

  React.useEffect(() => {
    setWidgetHost(window.location.origin);
  }, []);

  const canCreate = shouldQuery && !isCreating;
  const createDisabled = !canCreate || (!isPro && isProWidget(createType));

  const scriptSrc = React.useMemo(() => {
    const hostBase = widgetHost.trim().replace(/\/+$/, "");
    const script = `${hostBase}/widgets/tdrlp-widgets.es.js`;
    return hostBase.includes("localhost") || hostBase.includes("127.0.0.1") ? `${script}?v=dev` : script;
  }, [widgetHost]);

  const apiBaseClean = React.useMemo(() => apiBase.trim().replace(/\/+$/, "").replace(/\/api$/, ""), [apiBase]);

  const elementTag = widgetElementTag(revealKind);

  const embedSnippetHtml = React.useMemo(() => {
    return [
      `<script type="module" src="${scriptSrc}"></script>`,
      `<${elementTag}`,
      `  api-base="${apiBaseClean}"`,
      `  installation-id="${revealInstallationId}"`,
      `  api-key="${revealApiKey}"`,
      `  style="--tdrlp-bg: #ffffff; --tdrlp-fg: #0f172a; --tdrlp-muted: #475569; --tdrlp-border: #e2e8f0; --tdrlp-accent: #2563eb; --tdrlp-radius: 12px; --tdrlp-font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;"`,
      `></${elementTag}>`,
    ].join("\n");
  }, [apiBaseClean, elementTag, revealApiKey, revealInstallationId, scriptSrc]);

  const embedSnippetReact = React.useMemo(() => {
    return [
      `import * as React from "react";`,
      ``,
      `export function EmbeddedWidget() {`,
      `  React.useEffect(() => {`,
      `    const s = document.createElement("script");`,
      `    s.type = "module";`,
      `    s.src = "${scriptSrc}";`,
      `    document.head.appendChild(s);`,
      `    return () => s.remove();`,
      `  }, []);`,
      ``,
      `  return (`,
      `    // @ts-expect-error - custom element`,
      `    <${elementTag}`,
      `      api-base="${apiBaseClean}"`,
      `      installation-id="${revealInstallationId}"`,
      `      api-key="${revealApiKey}"`,
      `      style={{`,
      `        ["--tdrlp-bg" as any]: "#ffffff",`,
      `        ["--tdrlp-fg" as any]: "#0f172a",`,
      `        ["--tdrlp-muted" as any]: "#475569",`,
      `        ["--tdrlp-border" as any]: "#e2e8f0",`,
      `        ["--tdrlp-accent" as any]: "#2563eb",`,
      `        ["--tdrlp-radius" as any]: "12px",`,
      `        ["--tdrlp-font" as any]: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",`,
      `      }}`,
      `    />`,
      `  );`,
      `}`,
      ``,
    ].join("\n");
  }, [apiBaseClean, elementTag, revealApiKey, revealInstallationId, scriptSrc]);

  const currentSnippet = embedKind === "react" ? embedSnippetReact : embedSnippetHtml;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widgets</CardTitle>
          <CardDescription>
            Create authenticated embeds for your website. Keys are shown only once when created or rotated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Widget type</Label>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as WidgetType)}
              >
                <option value="profileCard">Profile card (free)</option>
                <option value="equityCurve" disabled>
                  Equity curve (free) — coming soon
                </option>
                <option value="journalMetrics" disabled>
                  Journal metrics (free) — coming soon
                </option>
                <option value="myTrades" disabled={!isPro}>
                  My trades (pro)
                </option>
                <option value="openPositions" disabled={!isPro}>
                  Open positions (pro)
                </option>
              </select>
              {!isPro && isProWidget(createType) ? (
                <div className="text-xs text-muted-foreground">Upgrade to Pro to create this widget.</div>
              ) : null}
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>Display name (optional)</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Homepage widget" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              disabled={createDisabled}
              onClick={async () => {
                setCopied(false);
                setIsCreating(true);
                try {
                  const res = await createInstallation({
                    widgetType: createType,
                    displayName: displayName.trim() || undefined,
                    config: undefined,
                  });
                  setRevealKind(createType);
                  setRevealInstallationId(String(res.installationId));
                  setRevealApiKey(res.apiKey);
                  setEmbedKind("html");
                  setRevealOpen(true);
                  setDisplayName("");
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              Create widget
            </Button>
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-medium">Your widgets</div>
            {!installations || installations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No widgets created yet.</div>
            ) : (
              <div className="grid gap-2">
                {installations.map((w) => {
                  const isLocked = isProWidget(w.widgetType) && !isPro;
                  return (
                    <div key={String(w._id)} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium">{w.displayName || widgetLabel(w.widgetType)}</div>
                        <div className="text-xs text-muted-foreground">
                          Type: {widgetLabel(w.widgetType)} · {w.enabled ? "Enabled" : "Disabled"}
                          {typeof w.lastUsedAt === "number" ? ` · Last used: ${new Date(w.lastUsedAt).toLocaleString()}` : ""}
                        </div>
                        {isLocked ? <div className="text-xs text-muted-foreground">Upgrade to Pro to use this widget.</div> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!shouldQuery}
                          onClick={async () => {
                            await setEnabled({ installationId: w._id, enabled: !w.enabled });
                          }}
                        >
                          {w.enabled ? "Disable" : "Enable"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!shouldQuery}
                          onClick={async () => {
                            setCopied(false);
                            const res = await rotateKey({ installationId: w._id });
                            setRevealKind(w.widgetType);
                            setRevealInstallationId(String(w._id));
                            setRevealApiKey(res.apiKey);
                            setEmbedKind("html");
                            setRevealOpen(true);
                          }}
                        >
                          Rotate key
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={!shouldQuery}
                          onClick={async () => {
                            await deleteInstallation({ installationId: w._id });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed widget</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Widget host (script src)</Label>
                <Input value={widgetHost} onChange={(e) => setWidgetHost(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>API base (Convex HTTP)</Label>
                <Input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Embed code</Label>
              <Tabs value={embedKind} onValueChange={(v) => setEmbedKind(v as "html" | "react")}>
                <TabsList>
                  <TabsTrigger value="html">Generate for HTML</TabsTrigger>
                  <TabsTrigger value="react">Generate for React</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <Textarea value={embedSnippetHtml} readOnly className="min-h-44 font-mono text-xs" />
                </TabsContent>
                <TabsContent value="react">
                  <Textarea value={embedSnippetReact} readOnly className="min-h-44 font-mono text-xs" />
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">API key is shown only this time.</div>
                <Button
                  type="button"
                  size="sm"
                  variant={copied ? "secondary" : "default"}
                  onClick={async () => {
                    await navigator.clipboard.writeText(currentSnippet);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Preview</div>
              <div className="rounded-lg border border-border/60 p-3">
                {elementTag === "tdrlp-profile-card" ? (
                  // @ts-expect-error - custom element
                  <tdrlp-profile-card
                    api-base={apiBaseClean}
                    installation-id={revealInstallationId}
                    api-key={revealApiKey}
                    style={widgetStyle}
                  />
                ) : elementTag === "tdrlp-my-trades" ? (
                  // @ts-expect-error - custom element
                  <tdrlp-my-trades
                    api-base={apiBaseClean}
                    installation-id={revealInstallationId}
                    api-key={revealApiKey}
                    style={widgetStyle}
                  />
                ) : (
                  // @ts-expect-error - custom element
                  <tdrlp-open-positions
                    api-base={apiBaseClean}
                    installation-id={revealInstallationId}
                    api-key={revealApiKey}
                    style={widgetStyle}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

