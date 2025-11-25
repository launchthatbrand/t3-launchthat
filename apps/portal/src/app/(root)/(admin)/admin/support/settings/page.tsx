"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { supportChatSettingsOptionKey } from "launchthat-plugin-support/settings";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";

interface SupportSettingsState {
  requireContact: boolean;
  fields: {
    fullName: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
  };
  introHeadline: string;
  welcomeMessage: string;
  privacyMessage: string;
}

const baseSupportSettings: SupportSettingsState = {
  requireContact: true,
  fields: {
    fullName: true,
    email: true,
    phone: false,
    company: false,
  },
  introHeadline: "Before we get started",
  welcomeMessage:
    "Tell us a bit more about yourself so we can personalize your experience.",
  privacyMessage:
    "We’ll use this information to reply to your questions and keep you updated.",
};

const fieldLabels: Record<keyof SupportSettingsState["fields"], string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  company: "Company",
};

const isOrganizationId = (value: unknown): value is Id<"organizations"> =>
  typeof value === "string" && value.length > 0;

interface OptionRecord {
  metaValue?: unknown;
}

const isOptionRecord = (value: unknown): value is OptionRecord =>
  typeof value === "object" && value !== null;

interface SupportOptionsQueryArgs {
  metaKey: string;
  type: "store";
  orgId: Id<"organizations">;
}

const mergeSupportSettings = (
  patch?: Partial<SupportSettingsState>,
): SupportSettingsState => ({
  ...baseSupportSettings,
  ...patch,
  fields: {
    ...baseSupportSettings.fields,
    ...(patch?.fields ?? {}),
  },
});

export default function SupportSettingsPage() {
  const tenant = useTenant();
  const maybeOrgId = tenant?._id;
  const organizationId = isOrganizationId(maybeOrgId) ? maybeOrgId : undefined;
  const optionArgs: SupportOptionsQueryArgs | "skip" = organizationId
    ? {
        metaKey: supportChatSettingsOptionKey,
        type: "store",
        orgId: organizationId,
      }
    : "skip";
  const optionQueryResult = useQuery(api.core.options.get, optionArgs);
  const settingsOption = isOptionRecord(optionQueryResult)
    ? optionQueryResult
    : undefined;
  const setOption = useMutation(api.core.options.set);
  const [formState, setFormState] = useState<SupportSettingsState>(
    mergeSupportSettings(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState<"general" | "copy">("general");

  const typedMetaValue: Partial<SupportSettingsState> | undefined =
    settingsOption && typeof settingsOption.metaValue === "object"
      ? (settingsOption.metaValue as Partial<SupportSettingsState>)
      : undefined;

  useEffect(() => {
    setFormState(mergeSupportSettings(typedMetaValue));
  }, [typedMetaValue]);

  const handleToggleField = (field: keyof SupportSettingsState["fields"]) => {
    setFormState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field],
      },
    }));
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast.error("Select an organization to update settings.");
      return;
    }
    setIsSaving(true);
    try {
      await setOption({
        metaKey: supportChatSettingsOptionKey,
        metaValue: formState,
        type: "store",
        orgId: organizationId,
      });
      toast.success("Support chat settings updated.");
    } catch (error) {
      console.error("[support-settings] save error", error);
      toast.error("Unable to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeFieldCount = useMemo(() => {
    const toggles = Object.values(formState.fields);
    return toggles.filter(Boolean).length;
  }, [formState.fields]);

  const handleTabChange = (value: string) => {
    if (value === "general" || value === "copy") {
      setTabValue(value);
    }
  };

  const tabs = [
    { label: "General", value: "general" },
    { label: "Form copy", value: "copy" },
  ];

  return (
    <AdminLayout
      title="Support Settings"
      description="Control how the floating assistant behaves and which contact details are captured."
      showTabs={true}
      activeTab={tabValue}
    >
      <AdminLayoutHeader customTabs={tabs} />
      <AdminLayoutContent withSidebar>
        <AdminLayoutMain className="space-y-6">
          <Tabs
            value={tabValue}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="copy">Form copy</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Contact capture</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Require visitors to share contact details before chatting.
                    </p>
                  </div>
                  <Switch
                    checked={formState.requireContact}
                    onCheckedChange={(checked) =>
                      setFormState((prev) => ({
                        ...prev,
                        requireContact: checked,
                      }))
                    }
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Fields to collect</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        Object.keys(
                          formState.fields,
                        ) as (keyof SupportSettingsState["fields"])[]
                      ).map((fieldKey) => (
                        <label
                          key={fieldKey}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={formState.fields[fieldKey]}
                            onCheckedChange={() => handleToggleField(fieldKey)}
                          />
                          {fieldLabels[fieldKey]}
                        </label>
                      ))}
                    </div>
                    {activeFieldCount === 0 && (
                      <p className="text-xs text-destructive">
                        Enable at least one field so you can capture contact
                        info.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormState(mergeSupportSettings())}
                      disabled={isSaving}
                    >
                      Reset
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="copy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form copy</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize the helper text shown above the contact form.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="support-intro">Intro headline</Label>
                      <Input
                        id="support-intro"
                        value={formState.introHeadline}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            introHeadline: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support-welcome">Welcome message</Label>
                      <Input
                        id="support-welcome"
                        value={formState.welcomeMessage}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            welcomeMessage: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-privacy">Privacy notice</Label>
                    <Textarea
                      id="support-privacy"
                      value={formState.privacyMessage}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          privacyMessage: event.target.value,
                        }))
                      }
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed below the form to explain how visitor details
                      are used.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormState(mergeSupportSettings())}
                      disabled={isSaving}
                    >
                      Reset
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AdminLayoutMain>
        <AdminLayoutSidebar>
          <Card>
            <CardHeader>
              <CardTitle>Need more control?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                More advanced workflows—like syncing contacts to your CRM—can be
                added via custom Convex functions. Reach out if you need help.
              </p>
            </CardContent>
          </Card>
        </AdminLayoutSidebar>
      </AdminLayoutContent>
    </AdminLayout>
  );
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
