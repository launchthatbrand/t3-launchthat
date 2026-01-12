"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { LogEntityList } from "launchthat-plugin-logs/admin";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const orgId = props.organizationId ? String(props.organizationId) : undefined;

  const me = useQuery(apiAny.core.users.queries.getMe, {});
  const actorUserId = (me as { _id?: unknown } | null)?._id;

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const requested = (params.get("tab") ?? "settings").toLowerCase().trim();
    if (requested !== "settings" && requested !== "logs") return "settings";
    return requested;
  }, [searchParamsString]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (!value || value === "settings") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(`/admin/edit?${params.toString()}`);
    },
    [router, searchParamsString],
  );

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
          defaultConsentText:
            draftConsent.trim() || defaultSettings.defaultConsentText,
          allowResendAfterComplete,
        },
      })
        .then(() => toast.success("Saved disclaimers settings"))
        .catch((err: unknown) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to save settings",
          ),
        );
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-4">
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
                <div className="font-medium">
                  Allow resending after complete
                </div>
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
                  setAllowResendAfterComplete(
                    resolved.allowResendAfterComplete,
                  );
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
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        {props.organizationId && actorUserId ? (
          <LogEntityList
            orgId={props.organizationId as any}
            actorUserId={actorUserId as any}
            listLogsQuery={apiAny.core.logs.queries.listLogsForOrg}
            listEmailSuggestionsQuery={
              apiAny.core.logs.queries.listEmailSuggestionsForOrg
            }
            title="Disclaimers logs"
            description="Issued / viewed / signed / downloaded activity."
            limit={200}
            initialPluginKey="disclaimers"
            hidePluginFilter
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
};
