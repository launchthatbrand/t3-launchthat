"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

const apiAny = api as any;

const SETTINGS_META_KEY = "plugin.disclaimers.settings";

type DisclaimersSettings = {
  defaultConsentText: string;
  allowResendAfterComplete: boolean;
};

const defaultSettings: DisclaimersSettings = {
  defaultConsentText: "I agree to the terms of this disclaimer.",
  allowResendAfterComplete: true,
};

export const DisclaimersSettingsPage = (props: PluginSettingComponentProps) => {
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

  const resolved = useMemo<DisclaimersSettings>(() => {
    const v = stored?.metaValue as Partial<DisclaimersSettings> | undefined;
    return {
      defaultConsentText:
        typeof v?.defaultConsentText === "string"
          ? v.defaultConsentText
          : defaultSettings.defaultConsentText,
      allowResendAfterComplete:
        typeof v?.allowResendAfterComplete === "boolean"
          ? v.allowResendAfterComplete
          : defaultSettings.allowResendAfterComplete,
    };
  }, [stored]);

  const [draftConsent, setDraftConsent] = useState(resolved.defaultConsentText);
  const [allowResendAfterComplete, setAllowResendAfterComplete] = useState(
    resolved.allowResendAfterComplete,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftConsent(resolved.defaultConsentText);
    setAllowResendAfterComplete(resolved.allowResendAfterComplete);
  }, [resolved.allowResendAfterComplete, resolved.defaultConsentText]);

  const handleSave = () => {
    startTransition(() => {
      void setOption({
        metaKey: SETTINGS_META_KEY,
        type: "site",
        orgId: (orgId ?? null) as any,
        metaValue: {
          defaultConsentText: draftConsent.trim() || defaultSettings.defaultConsentText,
          allowResendAfterComplete,
        },
      })
        .then(() => toast.success("Saved disclaimers settings"))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to save settings"),
        );
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Disclaimers settings</CardTitle>
          <CardDescription>
            Configure defaults and behavior for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Default consent text</Label>
            <Textarea
              value={draftConsent}
              onChange={(e) => setDraftConsent(e.target.value)}
              placeholder={defaultSettings.defaultConsentText}
            />
            <div className="text-muted-foreground text-sm">
              Used as the default when creating new templates.
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium">Allow resending after complete</div>
              <div className="text-muted-foreground text-sm">
                If disabled, completed issues can’t be resent.
              </div>
            </div>
            <Switch
              checked={allowResendAfterComplete}
              onCheckedChange={setAllowResendAfterComplete}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setDraftConsent(resolved.defaultConsentText);
                setAllowResendAfterComplete(resolved.allowResendAfterComplete);
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



