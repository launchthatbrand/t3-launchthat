"use client";

import * as React from "react";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex-config/_generated/api";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui";

type VisibilitySettings = {
  globalPublic: boolean;
  tradeIdeasPublic: boolean;
  ordersPublic: boolean;
  positionsPublic: boolean;
  profilePublic: boolean;
  analyticsReportsPublic: boolean;
};

export default function AdminSettingsVisibilityPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const current = useQuery(
    api.traderlaunchpad.queries.getMyVisibilitySettings,
    shouldQuery ? {} : "skip",
  ) as VisibilitySettings | undefined;

  const save = useMutation(api.traderlaunchpad.mutations.upsertMyVisibilitySettings);

  const [draft, setDraft] = React.useState<VisibilitySettings>({
    globalPublic: false,
    tradeIdeasPublic: false,
    ordersPublic: false,
    positionsPublic: false,
    profilePublic: false,
    analyticsReportsPublic: false,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!current) return;
    setDraft(current);
  }, [
    current?.analyticsReportsPublic,
    current?.globalPublic,
    current?.ordersPublic,
    current?.positionsPublic,
    current?.profilePublic,
    current?.tradeIdeasPublic,
  ]);

  const isReady = shouldQuery && current !== undefined;

  const effective = {
    globalPublic: Boolean(draft.globalPublic),
    tradeIdeasPublic: draft.globalPublic ? true : Boolean(draft.tradeIdeasPublic),
    ordersPublic: draft.globalPublic ? true : Boolean(draft.ordersPublic),
    positionsPublic: draft.globalPublic ? true : Boolean(draft.positionsPublic),
    profilePublic: draft.globalPublic ? true : Boolean(draft.profilePublic),
    analyticsReportsPublic: draft.globalPublic ? true : Boolean(draft.analyticsReportsPublic),
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/3 backdrop-blur-md">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-base">Default visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!isReady ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Global public defaults</div>
                  <div className="text-sm text-muted-foreground">
                    If enabled, new trade ideas, orders, positions, and your profile default to public.
                    You can still set any individual item to private later.
                  </div>
                </div>
                <Switch
                  checked={draft.globalPublic}
                  onCheckedChange={(v) => setDraft((d) => ({ ...d, globalPublic: v }))}
                />
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: "tradeIdeasPublic" as const,
                      label: "Trade ideas",
                      description:
                        "When enabled, new trade ideas default to Public. If disabled, they default to Private (but can still be shared by link).",
                    },
                    {
                      key: "analyticsReportsPublic" as const,
                      label: "Analytics reports",
                      description:
                        "When enabled, new reports default to Shareable (link).",
                    },
                    {
                      key: "ordersPublic" as const,
                      label: "Orders",
                      description: "When enabled, new orders default to Public.",
                    },
                    {
                      key: "positionsPublic" as const,
                      label: "Positions",
                      description: "When enabled, new positions default to Public.",
                    },
                    {
                      key: "profilePublic" as const,
                      label: "User profile",
                      description: "When enabled, your profile defaults to Public.",
                    },
                  ] as const
                ).map((row) => {
                  const disabled = draft.globalPublic;
                  const checked = (effective as any)[row.key] as boolean;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{row.label}</div>
                        <div className="text-sm text-muted-foreground">{row.description}</div>
                      </div>
                      <Switch
                        checked={checked}
                        disabled={disabled}
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
                      toast.success("Visibility settings saved.");
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

