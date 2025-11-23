"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

import type { PluginSettingComponentProps } from "~/lib/plugins/types";

export function CommerceStorefrontSettings({
  pluginName,
}: PluginSettingComponentProps) {
  const [isSaving, startTransition] = useTransition();
  const [currency, setCurrency] = useState("USD");
  const [collectShippingAddress, setCollectShippingAddress] = useState(true);

  const handleSubmit = () => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`${pluginName} storefront settings saved`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="store-currency">Default currency code</Label>
          <Input
            id="store-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <Label className="text-base">Collect shipping addresses</Label>
            <p className="text-sm text-muted-foreground">
              Disable this for digital-only products.
            </p>
          </div>
          <Switch
            checked={collectShippingAddress}
            onCheckedChange={setCollectShippingAddress}
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}








