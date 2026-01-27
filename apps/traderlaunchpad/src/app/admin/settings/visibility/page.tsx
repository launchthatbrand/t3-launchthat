"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Switch } from "@acme/ui/switch";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui";

interface VisibilitySettings {
  publicProfileEnabled: boolean;
  tradeIdeasIndexEnabled: boolean;
  tradeIdeaDetailEnabled: boolean;
  ordersIndexEnabled: boolean;
  orderDetailEnabled: boolean;
  analyticsReportsIndexEnabled: boolean;
  analyticsReportDetailEnabled: boolean;
}

export default function AdminSettingsVisibilityPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const accessPolicy = api as unknown as {
    accessPolicy: {
      getMyVisibilitySettings: unknown;
      upsertMyVisibilitySettings: unknown;
    };
  };

  const current = useQuery(
    accessPolicy.accessPolicy.getMyVisibilitySettings as never,
    shouldQuery ? {} : "skip",
  ) as VisibilitySettings | undefined;

  const save = useMutation(
    accessPolicy.accessPolicy.upsertMyVisibilitySettings as never,
  ) as unknown as (args: VisibilitySettings) => Promise<null>;

  const [draft, setDraft] = React.useState<VisibilitySettings>({
    publicProfileEnabled: false,
    tradeIdeasIndexEnabled: false,
    tradeIdeaDetailEnabled: false,
    ordersIndexEnabled: false,
    orderDetailEnabled: false,
    analyticsReportsIndexEnabled: false,
    analyticsReportDetailEnabled: false,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!current) return;
    setDraft(current);
  }, [current]);

  const rows = [
    {
      key: "publicProfileEnabled",
      label: "Public profile",
      description: "Allow others to view your public profile at /u/:username.",
    },
    {
      key: "tradeIdeasIndexEnabled",
      label: "Trade ideas (list)",
      description: "Allow others to view your trade ideas archive list page.",
    },
    {
      key: "tradeIdeaDetailEnabled",
      label: "Trade ideas (detail)",
      description: "Allow others to view individual trade idea pages.",
    },
    {
      key: "ordersIndexEnabled",
      label: "Orders (list)",
      description: "Allow others to view your orders archive list page.",
    },
    {
      key: "orderDetailEnabled",
      label: "Orders (detail)",
      description: "Allow others to view individual order pages.",
    },
    {
      key: "analyticsReportsIndexEnabled",
      label: "Analytics reports (list)",
      description: "Allow others to see your public analytics reports list (if available).",
    },
    {
      key: "analyticsReportDetailEnabled",
      label: "Analytics reports (detail)",
      description: "Allow others to view individual analytics reports (if available).",
    },
  ] satisfies {
    key: keyof VisibilitySettings;
    label: string;
    description: string;
  }[];

  const isReady = shouldQuery && current !== undefined;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-background/3 backdrop-blur-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Public visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!isReady ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="space-y-3">
                {rows.map((row) => {
                  const checked = Boolean(draft[row.key]);
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/20 p-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.label}</div>
                        <div className="text-sm text-muted-foreground">{row.description}</div>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(v) => setDraft((d) => ({ ...d, [row.key]: v }))}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await save(draft);
                      toast.success("Public visibility settings saved.");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Failed to save visibility settings.",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

