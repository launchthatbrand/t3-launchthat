"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { Copy, Loader2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
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
  const emailSettings = useQuery(api.plugins.support.queries.getEmailSettings, {
    organizationId,
  });
  const saveEmailSettings = useMutation(
    api.plugins.support.mutations.saveEmailSettings,
  );
  const beginDomainVerification = useMutation(
    api.plugins.support.mutations.beginDomainVerification,
  );
  const [formState, setFormState] = useState<SupportSettingsState>(
    mergeSupportSettings(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState<"general" | "copy" | "email">(
    "general",
  );
  const [domainInput, setDomainInput] = useState("");
  const [isEmailTogglePending, setIsEmailTogglePending] = useState(false);
  const [isDomainMutationPending, setIsDomainMutationPending] = useState(false);
  const [isTestingInbound, setIsTestingInbound] = useState(false);

  const typedMetaValue: Partial<SupportSettingsState> | undefined =
    optionQueryResult && typeof optionQueryResult === "object"
      ? (optionQueryResult.metaValue as
          | Partial<SupportSettingsState>
          | undefined)
      : undefined;

  useEffect(() => {
    setFormState(mergeSupportSettings(typedMetaValue));
  }, [typedMetaValue]);

  useEffect(() => {
    if (emailSettings?.customDomain !== undefined) {
      setDomainInput(emailSettings.customDomain ?? "");
    }
  }, [emailSettings?.customDomain]);

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
    { label: "Email intake", value: "email" },
  ];

  const allowEmailIntake = emailSettings?.allowEmailIntake ?? false;
  const verificationStatus = emailSettings?.verificationStatus ?? "unverified";

  const handleCopyToClipboard = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("[support-settings] copy error", error);
      toast.error("Unable to copy. Please try again.");
    }
  };

  const handleToggleEmailIntake = async (checked: boolean) => {
    setIsEmailTogglePending(true);
    try {
      await saveEmailSettings({
        organizationId,
        allowEmailIntake: checked,
      });
      toast.success(
        checked
          ? "Email intake enabled. New messages will create support threads."
          : "Email intake disabled.",
      );
    } catch (error) {
      console.error("[support-settings] toggle email error", error);
      toast.error("Unable to update email settings. Please try again.");
    } finally {
      setIsEmailTogglePending(false);
    }
  };

  const handleRequestDomain = async () => {
    if (!domainInput.trim()) {
      toast.error("Enter a domain before requesting verification.");
      return;
    }
    setIsDomainMutationPending(true);
    try {
      await beginDomainVerification({
        organizationId,
        domain: domainInput.trim().toLowerCase(),
      });
      toast.success(
        "Verification requested. Add the DNS records below to your domain.",
      );
    } catch (error) {
      console.error("[support-settings] domain request error", error);
      toast.error("Unable to start domain verification.");
    } finally {
      setIsDomainMutationPending(false);
    }
  };

  const handleClearDomain = async () => {
    setIsDomainMutationPending(true);
    try {
      await saveEmailSettings({
        organizationId,
        customDomain: null,
      });
      setDomainInput("");
      toast.success("Custom domain disconnected.");
    } catch (error) {
      console.error("[support-settings] clear domain error", error);
      toast.error("Unable to clear domain. Please try again.");
    } finally {
      setIsDomainMutationPending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!emailSettings?.defaultAlias) {
      toast.error("Alias not ready yet.");
      return;
    }
    setIsTestingInbound(true);
    try {
      const webhookUrl =
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL_WEBHOOK ??
        "https://determined-crocodile-286.convex.site/api/support/email/inbound";
      const timestamp = Date.now();
      const payload = {
        type: "email.received",
        data: {
          to: [emailSettings.defaultAlias],
          from: "LaunchThat Tester <tester@example.com>",
          subject: `Test inbound email ${new Date(timestamp).toLocaleString()}`,
          text: "This is a simulated inbound email triggered from the admin panel.",
          email_id: `test-email-${timestamp}`,
          message_id: `<test-${timestamp}@support.launchthat.app>`,
        },
      };
      console.log("payload", payload);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("response", response);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "HTTP error");
      }
      toast.success("Test email payload sent to Convex.");
    } catch (error) {
      console.error("[support-settings] test email error", error);
      toast.error("Unable to send test payload. Check console for details.");
    } finally {
      setIsTestingInbound(false);
    }
  };

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
          if (value === "general" || value === "copy" || value === "email") {
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
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTestEmail}
                disabled={!emailSettings?.defaultAlias || isTestingInbound}
              >
                {isTestingInbound ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send test inbound email"
                )}
              </Button>
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

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Email intake</CardTitle>
                <CardDescription>
                  Allow customers to email a shared inbox and have those
                  messages appear in the support dashboard.
                </CardDescription>
              </div>
              <Switch
                checked={allowEmailIntake}
                onCheckedChange={handleToggleEmailIntake}
                disabled={emailSettings === undefined || isEmailTogglePending}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default alias</Label>
                <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="font-mono">
                    {emailSettings?.defaultAlias ?? "loading…"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleCopyToClipboard(emailSettings?.defaultAlias)
                    }
                    disabled={!emailSettings?.defaultAlias}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy alias</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this address or set up a forwarder to capture messages
                  without connecting a custom domain.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Deliverability status:</span>
                <Badge variant="outline">{verificationStatus}</Badge>
                {emailSettings?.isCustomDomainConnected && (
                  <Badge variant="secondary">Custom domain active</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Connect a custom sending domain</CardTitle>
              <CardDescription>
                Authenticate your brand&apos;s domain so replies are sent from
                trusted email servers. We use Resend to provision DNS records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-domain">Domain</Label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    id="support-domain"
                    value={domainInput}
                    onChange={(event) => setDomainInput(event.target.value)}
                    placeholder="support.yourdomain.com"
                    disabled={isDomainMutationPending}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleRequestDomain}
                      disabled={
                        !domainInput.trim() ||
                        isDomainMutationPending ||
                        emailSettings === undefined
                      }
                    >
                      {isDomainMutationPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting…
                        </>
                      ) : (
                        "Connect domain"
                      )}
                    </Button>
                    {emailSettings?.customDomain && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClearDomain}
                        disabled={isDomainMutationPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {emailSettings?.dnsRecords?.length ? (
                <div className="space-y-2">
                  <Label>DNS records</Label>
                  <div className="space-y-3 rounded-md border p-3 text-sm">
                    {emailSettings.dnsRecords.map((record) => (
                      <div
                        key={`${record.type}-${record.host}`}
                        className="space-y-1 rounded-md border border-dashed p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-muted-foreground">
                          <span>{record.type}</span>
                          <span>record</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">Host:</span>
                          <code className="font-mono text-xs">
                            {record.host}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyToClipboard(record.host)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-muted-foreground">Value:</span>
                          <code className="font-mono text-xs">
                            {record.value}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyToClipboard(record.value)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add these records to your DNS provider, then return to this
                    page to confirm once propagation finishes.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  DNS records will appear here once you connect a domain.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
