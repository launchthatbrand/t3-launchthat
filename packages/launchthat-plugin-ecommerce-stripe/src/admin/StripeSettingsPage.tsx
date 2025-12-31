"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

const apiAny = api as any;

const STRIPE_SETTINGS_KEY = "plugin.ecommerce.stripe.settings";

type StripeSettings = {
  testMode: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

const empty: StripeSettings = {
  testMode: true,
  publishableKey: "",
  secretKey: "",
  webhookSecret: "",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
const asBoolean = (value: unknown): boolean => value === true;

export const StripeSettingsPage = (props: PluginSettingComponentProps) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;
  const [isPending, startTransition] = useTransition();

  const stored = useQuery(apiAny.core.options.get, {
    metaKey: STRIPE_SETTINGS_KEY,
    type: "site",
    orgId,
  }) as { metaValue?: unknown } | undefined;

  const save = useMutation(apiAny.core.options.set) as (
    args: any,
  ) => Promise<any>;

  const initial = useMemo((): StripeSettings => {
    const raw = asRecord(stored?.metaValue);
    return {
      testMode: asBoolean(raw.testMode),
      publishableKey: asString(raw.publishableKey),
      secretKey: asString(raw.secretKey),
      webhookSecret: asString(raw.webhookSecret),
    };
  }, [stored?.metaValue]);

  const [form, setForm] = useState<StripeSettings>(empty);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const handleSave = () => {
    startTransition(() => {
      void save({
        metaKey: STRIPE_SETTINGS_KEY,
        metaValue: form,
        type: "site",
        orgId,
      })
        .then(() => toast.success("Stripe settings saved."))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Save failed"),
        );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stripe</CardTitle>
          <CardDescription>
            Configure your Stripe account settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Test mode</div>
              <div className="text-muted-foreground text-xs">
                Use test keys and sandbox behavior.
              </div>
            </div>
            <Switch
              checked={form.testMode}
              disabled={isPending}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, testMode: checked }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stripe-pk">Publishable key</Label>
              <Input
                id="stripe-pk"
                value={form.publishableKey}
                disabled={isPending}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    publishableKey: nextValue,
                  }));
                }}
                placeholder="pk_live_... or pk_test_..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe-sk">Secret key</Label>
              <Input
                id="stripe-sk"
                value={form.secretKey}
                disabled={isPending}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    secretKey: nextValue,
                  }));
                }}
                placeholder="sk_live_... or sk_test_..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-webhook">Webhook signing secret</Label>
            <Input
              id="stripe-webhook"
              value={form.webhookSecret}
              disabled={isPending}
              onChange={(e) => {
                const nextValue = e.currentTarget.value;
                setForm((prev) => ({
                  ...prev,
                  webhookSecret: nextValue,
                }));
              }}
              placeholder="whsec_..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
