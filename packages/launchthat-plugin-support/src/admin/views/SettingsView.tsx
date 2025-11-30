"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { Copy, Loader2, PencilLine, Plus, Trash2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { SupportChatSettings } from "../../settings";
import {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "../../settings";

const fieldLabels: Record<keyof SupportChatSettings["fields"], string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  company: "Company",
};

type RagField = "title" | "excerpt" | "content";

const ragFieldLabels: Record<RagField, string> = {
  title: "Title",
  excerpt: "Excerpt",
  content: "Content / body",
};

const defaultRagFieldState: Record<RagField, boolean> = {
  title: true,
  excerpt: false,
  content: true,
};

interface RagSourceFormState {
  sourceId?: string;
  postTypeSlug?: string;
  fields: Record<RagField, boolean>;
  includeTags: boolean;
  metaFieldKeys: string[];
  additionalMetaKeys: string;
  displayName: string;
  isEnabled: boolean;
}

const createDefaultRagFormState = (): RagSourceFormState => ({
  fields: { ...defaultRagFieldState },
  includeTags: false,
  metaFieldKeys: [],
  additionalMetaKeys: "",
  displayName: "",
  isEnabled: true,
});

const mergeSupportSettings = (
  patch?: Partial<SupportChatSettings>,
): SupportChatSettings => ({
  ...defaultSupportChatSettings,
  ...patch,
  fields: {
    ...defaultSupportChatSettings.fields,
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
  const [formState, setFormState] = useState<SupportChatSettings>(
    mergeSupportSettings(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState<
    "general" | "copy" | "email" | "knowledge"
  >("general");
  const [domainInput, setDomainInput] = useState("");
  const [isEmailTogglePending, setIsEmailTogglePending] = useState(false);
  const [isDomainMutationPending, setIsDomainMutationPending] = useState(false);
  const [isTestingInbound, setIsTestingInbound] = useState(false);
  const ragSources = useQuery(api.plugins.support.queries.listRagSources, {
    organizationId,
  });
  const postTypes = useQuery(api.core.postTypes.queries.list, {
    includeBuiltIn: true,
    organizationId,
  });
  const saveRagSource = useMutation(
    api.plugins.support.mutations.saveRagSourceConfig,
  );
  const deleteRagSource = useMutation(
    api.plugins.support.mutations.deleteRagSourceConfig,
  );
  const [knowledgeForm, setKnowledgeForm] = useState<RagSourceFormState>(
    createDefaultRagFormState(),
  );
  const activePostTypeSlug = knowledgeForm.postTypeSlug;
  const postTypeFields = useQuery(
    api.core.postTypes.queries.fieldsBySlug,
    activePostTypeSlug
      ? {
          slug: activePostTypeSlug,
          organizationId,
        }
      : "skip",
  );
  const [isSavingSource, setIsSavingSource] = useState(false);

  const typedMetaValue: Partial<SupportChatSettings> | undefined =
    optionQueryResult && typeof optionQueryResult === "object"
      ? (optionQueryResult.metaValue as
          | Partial<SupportChatSettings>
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

  const handleToggleField = (field: keyof SupportChatSettings["fields"]) => {
    setFormState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: !prev.fields[field],
      },
    }));
  };

  const knowledgeSourcesLoading =
    ragSources === undefined ||
    postTypes === undefined ||
    (activePostTypeSlug ? postTypeFields === undefined : false);
  const knowledgeSources = ragSources ?? [];
  const postTypeOptions = postTypes ?? [];
  const postTypeFieldOptions = postTypeFields ?? [];

  const postTypeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of postTypeOptions) {
      map.set(type.slug, type.name ?? type.slug);
    }
    return map;
  }, [postTypeOptions]);

  const metaFieldOptions = useMemo(() => {
    return postTypeFieldOptions
      .filter((field) => !field.isSystem)
      .map((field) => ({
        key: field.key,
        label: field.name ?? field.key,
      }));
  }, [postTypeFieldOptions]);

  const handleResetKnowledgeForm = () => {
    setKnowledgeForm(createDefaultRagFormState());
  };

  const handleSelectKnowledgeSource = (
    source: (typeof knowledgeSources)[number],
  ) => {
    setKnowledgeForm({
      sourceId: source._id as string,
      postTypeSlug: source.postTypeSlug,
      fields: {
        title: source.fields.includes("title"),
        excerpt: source.fields.includes("excerpt"),
        content: source.fields.includes("content"),
      },
      includeTags: source.includeTags,
      metaFieldKeys: source.metaFieldKeys ?? [],
      additionalMetaKeys: "",
      displayName: source.displayName ?? "",
      isEnabled: source.isEnabled,
    });
  };

  const handleToggleRagField = (field: RagField) => {
    setKnowledgeForm((previous) => ({
      ...previous,
      fields: {
        ...previous.fields,
        [field]: !previous.fields[field],
      },
    }));
  };

  const handleToggleMetaField = (key: string) => {
    setKnowledgeForm((previous) => {
      const exists = previous.metaFieldKeys.includes(key);
      return {
        ...previous,
        metaFieldKeys: exists
          ? previous.metaFieldKeys.filter((current) => current !== key)
          : [...previous.metaFieldKeys, key],
      };
    });
  };

  const handleSaveKnowledgeSource = async () => {
    if (!knowledgeForm.postTypeSlug) {
      toast.error("Select a post type to index.");
      return;
    }

    const selectedFields = (
      Object.keys(knowledgeForm.fields) as RagField[]
    ).filter((key) => knowledgeForm.fields[key]);

    if (selectedFields.length === 0) {
      toast.error("Enable at least one content field.");
      return;
    }

    setIsSavingSource(true);
    try {
      const manualMetaFields = knowledgeForm.additionalMetaKeys
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean);
      const metaFields = [...knowledgeForm.metaFieldKeys, ...manualMetaFields];

      await saveRagSource({
        organizationId,
        sourceId: knowledgeForm.sourceId as Id<"supportRagSources"> | undefined,
        postTypeSlug: knowledgeForm.postTypeSlug,
        fields: selectedFields,
        includeTags: knowledgeForm.includeTags,
        metaFieldKeys: metaFields,
        displayName: knowledgeForm.displayName.trim() || undefined,
        isEnabled: knowledgeForm.isEnabled,
      });

      toast.success(
        "Knowledge source saved. Content from this post type will be indexed going forward.",
      );

      if (!knowledgeForm.sourceId) {
        handleResetKnowledgeForm();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save knowledge source.",
      );
    } finally {
      setIsSavingSource(false);
    }
  };

  const handleToggleKnowledgeSource = async (
    source: (typeof knowledgeSources)[number],
    nextValue: boolean,
  ) => {
    try {
      await saveRagSource({
        organizationId,
        sourceId: source._id as Id<"supportRagSources">,
        postTypeSlug: source.postTypeSlug,
        fields: source.fields as RagField[],
        includeTags: source.includeTags,
        metaFieldKeys: source.metaFieldKeys ?? [],
        displayName: source.displayName ?? undefined,
        isEnabled: nextValue,
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update knowledge source.",
      );
    }
  };

  const handleDeleteKnowledgeSource = async (sourceId: string) => {
    const confirmed = window.confirm(
      "Remove this indexing configuration? This will stop indexing for the selected post type.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteRagSource({
        organizationId,
        sourceId: sourceId as Id<"supportRagSources">,
      });
      if (knowledgeForm.sourceId === sourceId) {
        handleResetKnowledgeForm();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete knowledge configuration.",
      );
    }
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
    { label: "Knowledge sources", value: "knowledge" },
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
    <div className="space-y-6 overflow-scroll p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Support settings</h1>
        <p className="text-muted-foreground text-sm">
          Control how the floating assistant behaves and which contact details
          are captured.
        </p>
      </div>
      <Tabs
        value={tabValue}
        onValueChange={(value) => {
          if (
            value === "general" ||
            value === "copy" ||
            value === "email" ||
            value === "knowledge"
          ) {
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
                    Object.keys(formState.fields) as Array<
                      keyof SupportChatSettings["fields"]
                    >
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
                  <p className="text-destructive text-xs">
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
                <p className="text-muted-foreground text-xs">
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
                <p className="text-muted-foreground text-xs">
                  Share this address or set up a forwarder to capture messages
                  without connecting a custom domain.
                </p>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
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
                        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs uppercase">
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
                  <p className="text-muted-foreground text-xs">
                    Add these records to your DNS provider, then return to this
                    page to confirm once propagation finishes.
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  DNS records will appear here once you connect a domain.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge sources</CardTitle>
              <CardDescription>
                Control which post types should be indexed for RAG so the agent
                can answer questions about your lessons, articles, or docs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {knowledgeSourcesLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading post types…
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Indexed sources</p>
                        <p className="text-muted-foreground text-xs">
                          Enable the post types that should feed helpdesk
                          answers.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetKnowledgeForm}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New configuration
                      </Button>
                    </div>
                    {knowledgeSources.length ? (
                      <div className="space-y-3">
                        {knowledgeSources.map((source) => (
                          <div
                            key={source._id as string}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {postTypeLabelMap.get(source.postTypeSlug) ??
                                  source.postTypeSlug}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Fields: {source.fields.join(", ")}
                                {source.includeTags ? ", tags" : ""}
                                {source.metaFieldKeys?.length
                                  ? `, meta: ${source.metaFieldKeys.join(", ")}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={source.isEnabled}
                                onCheckedChange={(checked) =>
                                  handleToggleKnowledgeSource(
                                    source,
                                    Boolean(checked),
                                  )
                                }
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  handleSelectKnowledgeSource(source)
                                }
                              >
                                <PencilLine className="h-4 w-4" />
                                <span className="sr-only">Edit source</span>
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteKnowledgeSource(
                                    source._id as string,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove source</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No post types are being indexed yet. Add a configuration
                        below to start training the agent with your own content.
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <p className="text-sm font-medium">Editor</p>
                      <p className="text-muted-foreground text-xs">
                        Pick a post type, choose the content fields to include,
                        and optionally add tags or meta fields for richer
                        context.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="rag-post-type">Post type</Label>
                        <Select
                          value={knowledgeForm.postTypeSlug ?? ""}
                          onValueChange={(value) =>
                            setKnowledgeForm((prev) => ({
                              ...prev,
                              postTypeSlug: value,
                            }))
                          }
                        >
                          <SelectTrigger id="rag-post-type">
                            <SelectValue placeholder="Select a post type" />
                          </SelectTrigger>
                          <SelectContent>
                            {postTypeOptions.length === 0 ? (
                              <SelectItem value="" disabled>
                                No post types available
                              </SelectItem>
                            ) : (
                              postTypeOptions.map((type) => (
                                <SelectItem
                                  key={type._id as string}
                                  value={type.slug}
                                >
                                  {type.name ?? type.slug}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rag-display-name">Display name</Label>
                        <Input
                          id="rag-display-name"
                          placeholder="Internal label"
                          value={knowledgeForm.displayName}
                          onChange={(event) =>
                            setKnowledgeForm((prev) => ({
                              ...prev,
                              displayName: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={knowledgeForm.isEnabled}
                        onCheckedChange={(checked) =>
                          setKnowledgeForm((prev) => ({
                            ...prev,
                            isEnabled: Boolean(checked),
                          }))
                        }
                      />
                      <span className="text-sm">Enable indexing</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Content fields</Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(Object.keys(ragFieldLabels) as RagField[]).map(
                          (field) => (
                            <label
                              key={field}
                              className="flex items-center gap-2 rounded-md border p-2 text-sm"
                            >
                              <Checkbox
                                checked={knowledgeForm.fields[field]}
                                onCheckedChange={() =>
                                  handleToggleRagField(field)
                                }
                              />
                              {ragFieldLabels[field]}
                            </label>
                          ),
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={knowledgeForm.includeTags}
                        onCheckedChange={(checked) =>
                          setKnowledgeForm((prev) => ({
                            ...prev,
                            includeTags: Boolean(checked),
                          }))
                        }
                      />
                      Include post tags in the search prompt
                    </label>
                    <div className="space-y-2">
                      <Label>Custom fields to include</Label>
                      {knowledgeForm.postTypeSlug ? (
                        metaFieldOptions.length ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {metaFieldOptions.map((field) => (
                              <label
                                key={field.key}
                                className="flex items-center gap-2 rounded-md border p-2 text-sm"
                              >
                                <Checkbox
                                  checked={knowledgeForm.metaFieldKeys.includes(
                                    field.key,
                                  )}
                                  onCheckedChange={() =>
                                    handleToggleMetaField(field.key)
                                  }
                                />
                                {field.label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            This post type does not have custom fields yet.
                          </p>
                        )
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Select a post type to load its custom fields.
                        </p>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="rag-meta-fields-manual">
                          Additional meta keys (comma separated)
                        </Label>
                        <Input
                          id="rag-meta-fields-manual"
                          placeholder="e.g. topic, difficulty"
                          value={knowledgeForm.additionalMetaKeys}
                          onChange={(event) =>
                            setKnowledgeForm((prev) => ({
                              ...prev,
                              additionalMetaKeys: event.target.value,
                            }))
                          }
                        />
                        <p className="text-muted-foreground text-xs">
                          Optional. Provide extra meta keys to include
                          structured data when no custom field exists.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveKnowledgeSource}
                        disabled={
                          isSavingSource ||
                          !knowledgeForm.postTypeSlug ||
                          postTypeOptions.length === 0
                        }
                      >
                        {isSavingSource ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : knowledgeForm.sourceId ? (
                          "Save changes"
                        ) : (
                          "Add source"
                        )}
                      </Button>
                      {knowledgeForm.sourceId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetKnowledgeForm}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
