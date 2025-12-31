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

const AUTHNET_SETTINGS_KEY = "plugin.ecommerce.authorizenet.settings";

type AuthNetSettings = {
  sandbox: boolean;
  apiLoginId: string;
  clientKey: string;
  transactionKey: string;
  signatureKey: string;
};

const empty: AuthNetSettings = {
  sandbox: true,
  apiLoginId: "",
  clientKey: "",
  transactionKey: "",
  signatureKey: "",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
const asBoolean = (value: unknown): boolean => value === true;

export const AuthorizeNetSettingsPage = (
  props: PluginSettingComponentProps,
) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;
  const [isPending, startTransition] = useTransition();

  const stored = useQuery(apiAny.core.options.get, {
    metaKey: AUTHNET_SETTINGS_KEY,
    type: "site",
    orgId,
  }) as { metaValue?: unknown } | undefined;

  const save = useMutation(apiAny.core.options.set) as (
    args: any,
  ) => Promise<any>;

  const initial = useMemo((): AuthNetSettings => {
    const raw = asRecord(stored?.metaValue);
    return {
      sandbox: asBoolean(raw.sandbox),
      apiLoginId: asString(raw.apiLoginId),
      clientKey: asString(raw.clientKey),
      transactionKey: asString(raw.transactionKey),
      signatureKey: asString(raw.signatureKey),
    };
  }, [stored?.metaValue]);

  const [form, setForm] = useState<AuthNetSettings>(empty);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const handleSave = () => {
    startTransition(() => {
      void save({
        metaKey: AUTHNET_SETTINGS_KEY,
        metaValue: form,
        type: "site",
        orgId,
      })
        .then(() => toast.success("Authorize.Net settings saved."))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Save failed"),
        );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authorize.Net</CardTitle>
          <CardDescription>
            Configure your Authorize.Net gateway credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Sandbox</div>
              <div className="text-muted-foreground text-xs">
                Use the Authorize.Net sandbox environment.
              </div>
            </div>
            <Switch
              checked={form.sandbox}
              disabled={isPending}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, sandbox: checked }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="authnet-login">API Login ID</Label>
              <Input
                id="authnet-login"
                value={form.apiLoginId}
                disabled={isPending}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    apiLoginId: nextValue,
                  }));
                }}
                placeholder="Your API Login ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authnet-client-key">Client Key (Accept.js)</Label>
              <Input
                id="authnet-client-key"
                value={form.clientKey}
                disabled={isPending}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    clientKey: nextValue,
                  }));
                }}
                placeholder="Your Client Key"
              />
              <div className="text-muted-foreground text-xs">
                Used in the browser to tokenize card details (Accept.js).
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="authnet-tx">Transaction Key</Label>
              <Input
                id="authnet-tx"
                value={form.transactionKey}
                disabled={isPending}
                onChange={(e) => {
                  const nextValue = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    transactionKey: nextValue,
                  }));
                }}
                placeholder="Your Transaction Key"
              />
            </div>
            <div className="space-y-2" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authnet-sig">Signature Key</Label>
            <Input
              id="authnet-sig"
              value={form.signatureKey}
              disabled={isPending}
              onChange={(e) => {
                const nextValue = e.currentTarget.value;
                setForm((prev) => ({
                  ...prev,
                  signatureKey: nextValue,
                }));
              }}
              placeholder="Your Signature Key"
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
