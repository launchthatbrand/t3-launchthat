"use client";

import React from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

import type { ShortlinkSettings } from "../types";

export const ShortlinksSettingsCard = (props: {
  settings: ShortlinkSettings;
  disabled?: boolean;
  onSave: (next: ShortlinkSettings) => Promise<void> | void;
}) => {
  const [domain, setDomain] = React.useState(props.settings.domain);
  const [enabled, setEnabled] = React.useState(Boolean(props.settings.enabled));
  const [codeLength, setCodeLength] = React.useState(String(props.settings.codeLength));

  React.useEffect(() => {
    setDomain(props.settings.domain);
    setEnabled(Boolean(props.settings.enabled));
    setCodeLength(String(props.settings.codeLength));
  }, [props.settings.domain, props.settings.enabled, props.settings.codeLength]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shortlinks</CardTitle>
        <CardDescription>
          Configure the shortlink domain and code generation settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shortlinks-domain">Domain</Label>
            <Input
              id="shortlinks-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="tdrlp.com"
              disabled={Boolean(props.disabled)}
            />
            <div className="text-muted-foreground text-xs">
              Enter a hostname only (no `https://`, no path).
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortlinks-codeLength">Code length</Label>
            <Input
              id="shortlinks-codeLength"
              value={codeLength}
              onChange={(e) => setCodeLength(e.target.value)}
              inputMode="numeric"
              placeholder="6"
              disabled={Boolean(props.disabled)}
            />
            <div className="text-muted-foreground text-xs">
              Default is 6; larger reduces collisions.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">Enabled</div>
            <div className="text-muted-foreground text-xs">
              When disabled, new shortlinks can still be created, but UI may hide the short domain.
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={Boolean(props.disabled)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={Boolean(props.disabled)}
            onClick={async () => {
              const next: ShortlinkSettings = {
                domain: domain.trim(),
                enabled,
                codeLength: Math.max(1, Number.parseInt(codeLength, 10) || 0),
              };
              await props.onSave(next);
            }}
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

