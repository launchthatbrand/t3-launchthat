"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

const apiAny = api as any;

const SETTINGS_META_KEY = "plugin.ecommerce.settings";

type EcommerceSettings = {
  defaultCurrency: string;
  enableTax: boolean;
  enableShipping: boolean;
  allowGuestCheckout: boolean;
};

const defaultSettings: EcommerceSettings = {
  defaultCurrency: "USD",
  enableTax: false,
  enableShipping: false,
  allowGuestCheckout: true,
};

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

export const EcommerceSettingsPage = (props: PluginSettingComponentProps) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;

  const stored = useQuery(apiAny.core.options.get, {
    metaKey: SETTINGS_META_KEY,
    type: "site",
    orgId: props.organizationId ?? null,
  }) as { metaValue?: unknown } | null | undefined;

  const setOption = useMutation(apiAny.core.options.set) as (args: {
    metaKey: string;
    metaValue: unknown;
    type?: "store" | "site";
    orgId?: string | null;
  }) => Promise<string>;

  const resolved = useMemo<EcommerceSettings>(() => {
    const v = stored?.metaValue as Partial<EcommerceSettings> | undefined;
    const currency = asString(v?.defaultCurrency).trim();
    return {
      defaultCurrency: currency.length > 0 ? currency : defaultSettings.defaultCurrency,
      enableTax: typeof v?.enableTax === "boolean" ? v.enableTax : defaultSettings.enableTax,
      enableShipping:
        typeof v?.enableShipping === "boolean"
          ? v.enableShipping
          : defaultSettings.enableShipping,
      allowGuestCheckout:
        typeof v?.allowGuestCheckout === "boolean"
          ? v.allowGuestCheckout
          : defaultSettings.allowGuestCheckout,
    };
  }, [stored]);

  const [defaultCurrency, setDefaultCurrency] = useState(resolved.defaultCurrency);
  const [enableTax, setEnableTax] = useState(resolved.enableTax);
  const [enableShipping, setEnableShipping] = useState(resolved.enableShipping);
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(
    resolved.allowGuestCheckout,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDefaultCurrency(resolved.defaultCurrency);
    setEnableTax(resolved.enableTax);
    setEnableShipping(resolved.enableShipping);
    setAllowGuestCheckout(resolved.allowGuestCheckout);
  }, [resolved]);

  const handleSave = () => {
    startTransition(() => {
      void setOption({
        metaKey: SETTINGS_META_KEY,
        type: "site",
        orgId: (orgId ?? null) as any,
        metaValue: {
          defaultCurrency: defaultCurrency.trim() || defaultSettings.defaultCurrency,
          enableTax,
          enableShipping,
          allowGuestCheckout,
        } satisfies EcommerceSettings,
      })
        .then(() => toast.success("Saved ecommerce settings"))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to save settings"),
        );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ecommerce settings</CardTitle>
          <CardDescription>
            Configure global defaults and behavior for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ecom-default-currency">Default currency</Label>
              <Input
                id="ecom-default-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                placeholder={defaultSettings.defaultCurrency}
              />
              <div className="text-muted-foreground text-sm">
                Used as the default currency for order totals and checkout.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Enable tax</div>
              <div className="text-muted-foreground text-sm">
                Turn on tax calculations (rates/config coming next).
              </div>
            </div>
            <Switch checked={enableTax} onCheckedChange={setEnableTax} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Enable shipping</div>
              <div className="text-muted-foreground text-sm">
                Turn on shipping fields and shipping rate calculations.
              </div>
            </div>
            <Switch checked={enableShipping} onCheckedChange={setEnableShipping} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Allow guest checkout</div>
              <div className="text-muted-foreground text-sm">
                If disabled, customers must be signed in to purchase.
              </div>
            </div>
            <Switch
              checked={allowGuestCheckout}
              onCheckedChange={setAllowGuestCheckout}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setDefaultCurrency(resolved.defaultCurrency);
                setEnableTax(resolved.enableTax);
                setEnableShipping(resolved.enableShipping);
                setAllowGuestCheckout(resolved.allowGuestCheckout);
              }}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


