"use client";

import * as React from "react";

import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

const clampBps = (n: number): number => Math.max(0, Math.min(10000, Math.round(n)));

export default function PlatformSettingsAffiliatesPage() {
  const settings = useQuery(api.platform.affiliates.getMlmSettings, {});
  const save = useMutation(api.platform.affiliates.setMlmSettings);

  const [mlmEnabled, setMlmEnabled] = React.useState(true);
  const [directCommissionBps, setDirectCommissionBps] = React.useState(2000);
  const [sponsorOverrideBps, setSponsorOverrideBps] = React.useState(500);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!settings) return;
    setMlmEnabled(Boolean(settings.mlmEnabled));
    setDirectCommissionBps(clampBps(settings.directCommissionBps));
    setSponsorOverrideBps(clampBps(settings.sponsorOverrideBps));
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await save({
        mlmEnabled,
        directCommissionBps: clampBps(directCommissionBps),
        sponsorOverrideBps: clampBps(sponsorOverrideBps),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Affiliates</CardTitle>
          <CardDescription>
            Configure MLM sponsor override commissions. Direct affiliate earns on their own sales; sponsor earns on
            child sales only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Enable sponsor override</div>
              <div className="text-muted-foreground text-sm">
                If enabled, the sponsor of a direct affiliate receives an override commission (one level up).
              </div>
            </div>
            <Switch checked={mlmEnabled} onCheckedChange={setMlmEnabled} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Direct commission (bps)</Label>
              <Input
                inputMode="numeric"
                value={String(directCommissionBps)}
                onChange={(e) => setDirectCommissionBps(Number(e.target.value))}
              />
              <div className="text-muted-foreground text-xs">
                2000 bps = 20%. Paid to the affiliate who referred the buyer.
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sponsor override (bps)</Label>
              <Input
                inputMode="numeric"
                value={String(sponsorOverrideBps)}
                onChange={(e) => setSponsorOverrideBps(Number(e.target.value))}
                disabled={!mlmEnabled}
              />
              <div className="text-muted-foreground text-xs">
                500 bps = 5%. Paid to the direct affiliate’s sponsor (not paid if no sponsor).
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleSave} disabled={!settings || isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

