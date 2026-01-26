"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Switch } from "@acme/ui/switch";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui";

type PermissionsSettings = {
  globalEnabled: boolean;
  tradeIdeasEnabled: boolean;
  openPositionsEnabled: boolean;
  ordersEnabled: boolean;
};

type OrgPermissionsRow = PermissionsSettings & {
  organizationId: string;
  role: string;
};

export default function AdminSettingsVisibilityPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const globalCurrent = useQuery(
    api.traderlaunchpad.queries.getMyGlobalPermissions,
    shouldQuery ? {} : "skip",
  ) as PermissionsSettings | undefined;

  const orgRows = useQuery(
    api.traderlaunchpad.queries.listMyOrgPermissions,
    shouldQuery ? {} : "skip",
  ) as OrgPermissionsRow[] | undefined;

  const saveGlobal = useMutation(api.traderlaunchpad.mutations.upsertMyGlobalPermissions);
  const saveOrg = useMutation(api.traderlaunchpad.mutations.upsertMyOrgPermissions);

  const [globalDraft, setGlobalDraft] = React.useState<PermissionsSettings>({
    globalEnabled: false,
    tradeIdeasEnabled: false,
    openPositionsEnabled: false,
    ordersEnabled: false,
  });
  const [orgDrafts, setOrgDrafts] = React.useState<Record<string, PermissionsSettings>>({});
  const [savingGlobal, setSavingGlobal] = React.useState(false);
  const [savingOrgId, setSavingOrgId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!globalCurrent) return;
    setGlobalDraft(globalCurrent);
  }, [globalCurrent?.globalEnabled, globalCurrent?.openPositionsEnabled, globalCurrent?.ordersEnabled, globalCurrent?.tradeIdeasEnabled]);

  React.useEffect(() => {
    if (!orgRows) return;
    const next: Record<string, PermissionsSettings> = {};
    for (const r of orgRows) {
      next[r.organizationId] = {
        globalEnabled: Boolean(r.globalEnabled),
        tradeIdeasEnabled: Boolean(r.tradeIdeasEnabled),
        openPositionsEnabled: Boolean(r.openPositionsEnabled),
        ordersEnabled: Boolean(r.ordersEnabled),
      };
    }
    setOrgDrafts(next);
  }, [orgRows]);

  const isReady = shouldQuery && globalCurrent !== undefined && orgRows !== undefined;

  const effectiveGlobal = {
    globalEnabled: Boolean(globalDraft.globalEnabled),
    tradeIdeasEnabled: globalDraft.globalEnabled ? true : Boolean(globalDraft.tradeIdeasEnabled),
    openPositionsEnabled: globalDraft.globalEnabled ? true : Boolean(globalDraft.openPositionsEnabled),
    ordersEnabled: globalDraft.globalEnabled ? true : Boolean(globalDraft.ordersEnabled),
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-background/3 backdrop-blur-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Public permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!isReady ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/20 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Enable public sharing</div>
                  <div className="text-sm text-muted-foreground">
                    If enabled, your selected data types can be used in public/platform views. This is a master toggle
                    for the public scope.
                  </div>
                </div>
                <Switch
                  checked={globalDraft.globalEnabled}
                  onCheckedChange={(v) => setGlobalDraft((d) => ({ ...d, globalEnabled: v }))}
                />
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: "tradeIdeasEnabled" as const,
                      label: "Trade ideas",
                      description: "Allow your trade ideas to be visible publicly.",
                    },
                    {
                      key: "ordersEnabled" as const,
                      label: "Orders",
                      description: "Allow your orders to be visible publicly.",
                    },
                    {
                      key: "openPositionsEnabled" as const,
                      label: "Open positions",
                      description: "Allow your open positions to be used in public/community aggregates.",
                    },
                  ] as const
                ).map((row) => {
                  const disabled = globalDraft.globalEnabled;
                  const checked = (effectiveGlobal as any)[row.key] as boolean;
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
                        disabled={disabled}
                        onCheckedChange={(v) => setGlobalDraft((d) => ({ ...d, [row.key]: v }))}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={savingGlobal}
                  onClick={async () => {
                    setSavingGlobal(true);
                    try {
                      await saveGlobal(globalDraft);
                      toast.success("Public permissions saved.");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Failed to save public permissions.",
                      );
                    } finally {
                      setSavingGlobal(false);
                    }
                  }}
                >
                  {savingGlobal ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-background/3 backdrop-blur-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Organization permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {!isReady ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : orgRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">You’re not a member of any organizations.</div>
          ) : (
            <div className="space-y-4">
              {orgRows.map((org) => {
                const draft = orgDrafts[org.organizationId] ?? {
                  globalEnabled: false,
                  tradeIdeasEnabled: false,
                  openPositionsEnabled: false,
                  ordersEnabled: false,
                };
                const effective = {
                  globalEnabled: Boolean(draft.globalEnabled),
                  tradeIdeasEnabled: draft.globalEnabled ? true : Boolean(draft.tradeIdeasEnabled),
                  openPositionsEnabled: draft.globalEnabled ? true : Boolean(draft.openPositionsEnabled),
                  ordersEnabled: draft.globalEnabled ? true : Boolean(draft.ordersEnabled),
                };

                return (
                  <div
                    key={org.organizationId}
                    className="space-y-3 rounded-lg border border-border bg-background/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Org: {org.organizationId}</div>
                        <div className="text-sm text-muted-foreground">Role: {org.role || "member"}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground">Master</div>
                        <Switch
                          checked={draft.globalEnabled}
                          onCheckedChange={(v) =>
                            setOrgDrafts((prev) => ({
                              ...prev,
                              [org.organizationId]: { ...draft, globalEnabled: v },
                            }))
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={savingOrgId === org.organizationId}
                          onClick={async () => {
                            setSavingOrgId(org.organizationId);
                            try {
                              await saveOrg({ organizationId: org.organizationId, ...draft });
                              toast.success("Organization permissions saved.");
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to save organization permissions.",
                              );
                            } finally {
                              setSavingOrgId(null);
                            }
                          }}
                        >
                          {savingOrgId === org.organizationId ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(
                        [
                          {
                            key: "tradeIdeasEnabled" as const,
                            label: "Trade ideas",
                            description: "Allow this org to use your trade ideas in org views.",
                          },
                          {
                            key: "ordersEnabled" as const,
                            label: "Orders",
                            description: "Allow this org to use your orders in org views.",
                          },
                          {
                            key: "openPositionsEnabled" as const,
                            label: "Open positions",
                            description: "Allow this org to use your open positions in aggregates / Discord.",
                          },
                        ] as const
                      ).map((row) => {
                        const disabled = draft.globalEnabled;
                        const checked = (effective as any)[row.key] as boolean;
                        return (
                          <div
                            key={row.key}
                            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/10 p-4"
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium">{row.label}</div>
                              <div className="text-sm text-muted-foreground">{row.description}</div>
                            </div>
                            <Switch
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(v) =>
                                setOrgDrafts((prev) => ({
                                  ...prev,
                                  [org.organizationId]: { ...draft, [row.key]: v },
                                }))
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

