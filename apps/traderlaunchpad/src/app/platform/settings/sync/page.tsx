"use client";

import * as React from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui";

import { api } from "@convex-config/_generated/api";

const toMinutes = (ms: number): number => Math.round(ms / 60_000);
const toMs = (minutes: number): number => minutes * 60_000;
const clampMinutes = (value: number): number => Math.max(1, Math.min(10, value));

export default function PlatformSettingsSyncPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as { isAdmin: boolean } | undefined;

  const settings = useQuery(
    api.platform.brokerSyncSettings.getBrokerSyncSettings,
    shouldQuery ? {} : "skip",
  ) as
    | {
        freeIntervalMs: number;
        standardIntervalMs: number;
        proIntervalMs: number;
      }
    | undefined;

  const upsert = useMutation(api.platform.brokerSyncSettings.upsertBrokerSyncSettings);
  const [saving, setSaving] = React.useState(false);
  const [freeMinutes, setFreeMinutes] = React.useState(5);
  const [standardMinutes, setStandardMinutes] = React.useState(2);
  const [proMinutes, setProMinutes] = React.useState(1);

  React.useEffect(() => {
    if (!settings) return;
    setFreeMinutes(clampMinutes(toMinutes(settings.freeIntervalMs)));
    setStandardMinutes(clampMinutes(toMinutes(settings.standardIntervalMs)));
    setProMinutes(clampMinutes(toMinutes(settings.proIntervalMs)));
  }, [settings]);

  if (!shouldQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broker sync cadence</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!viewerSettings?.isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broker sync cadence</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Admin access required.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => {
            if (!settings) return;
            setFreeMinutes(clampMinutes(toMinutes(settings.freeIntervalMs)));
            setStandardMinutes(clampMinutes(toMinutes(settings.standardIntervalMs)));
            setProMinutes(clampMinutes(toMinutes(settings.proIntervalMs)));
          }}
        >
          Reset
        </Button>
        <Button
          className="border-0 bg-blue-600 text-white hover:bg-blue-700"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await upsert({
                freeIntervalMs: toMs(clampMinutes(freeMinutes)),
                standardIntervalMs: toMs(clampMinutes(standardMinutes)),
                proIntervalMs: toMs(clampMinutes(proMinutes)),
              });
              toast.success("Broker sync cadence updated.");
            } catch {
              toast.error("Failed to update broker sync cadence.");
            } finally {
              setSaving(false);
            }
          }}
        >
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Broker sync cadence</CardTitle>
          <CardDescription>
            Set default sync frequency by entitlement tier. Values are clamped between 1–10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Free (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={freeMinutes}
              onChange={(event) => setFreeMinutes(Number(event.target.value))}
            />
            <div className="text-muted-foreground text-xs">
              Default cadence for free users.
            </div>
          </div>
          <div className="space-y-2">
            <Label>Standard (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={standardMinutes}
              onChange={(event) => setStandardMinutes(Number(event.target.value))}
            />
            <div className="text-muted-foreground text-xs">
              Default cadence for standard users.
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pro (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={proMinutes}
              onChange={(event) => setProMinutes(Number(event.target.value))}
            />
            <div className="text-muted-foreground text-xs">
              Default cadence for pro users.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
