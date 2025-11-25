"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { supportChatSettingsOptionKey } from "../../settings";

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

interface SettingsViewProps {
  organizationId: Id<"organizations">;
}

export function SettingsView({ organizationId }: SettingsViewProps) {
  const optionArgs = {
    metaKey: supportChatSettingsOptionKey,
    type: "store" as const,
    orgId: organizationId,
  };
  const optionQueryResult = useQuery(api.core.options.get, optionArgs);
  const setOption = useMutation(api.core.options.set);
  const [formState, setFormState] = useState<SupportSettingsState>(
    mergeSupportSettings(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState<"general" | "copy">("general");

  const typedMetaValue: Partial<SupportSettingsState> | undefined =
    optionQueryResult && typeof optionQueryResult === "object"
      ? (optionQueryResult.metaValue as
          | Partial<SupportSettingsState>
          | undefined)
      : undefined;

  useEffect(() => {
    setFormState(mergeSupportSettings(typedMetaValue));
  }, [typedMetaValue]);

  const activeFieldCount = useMemo(() => {
    const toggles = Object.values(formState.fields);
    return toggles.filter(Boolean).length;
  }, [formState.fields]);

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

  const tabs = [
    { label: "General", value: "general" },
    { label: "Form copy", value: "copy" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Support settings</h1>
        <p className="text-sm text-muted-foreground">
          Control how the floating assistant behaves and which contact details
          are captured.
        </p>
      </div>
      <Tabs
        value={tabValue}
        onValueChange={(value) => {
          if (value === "general" || value === "copy") {
            setTabValue(value);
          }
        }}
        className="space-y-6"
      >
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contact capture</CardTitle>
                <CardDescription>
                  Require visitors to share contact details before chatting.
                </CardDescription>
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
                    Enable at least one field so you can capture contact info.
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
              <CardDescription>
                Customize the helper text shown above the contact form.
              </CardDescription>
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
                  Displayed below the form to explain how visitor details are
                  used.
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
    </div>
  );
}
