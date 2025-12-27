"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
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

import { useTenant } from "~/context/TenantContext";

interface EmailProviderStatus {
  resendConfigured: boolean;
}

interface EmailSenderOptions {
  portalDomain: string;
  customDomain?: string | null;
  canUseCustomDomain: boolean;
  customDomainStatus: "unconfigured" | "pending" | "verified" | "error";
}

interface EmailSettings {
  enabled: boolean;
  fromName: string;
  fromMode: "portal" | "custom";
  fromLocalPart: string;
  replyToEmail?: string | null;
  designKey?: "clean" | "bold" | "minimal";
}

interface TemplatePreviewResult {
  subject: string;
  subjectTemplateUsed: string;
  html: string;
  text: string;
  designKey: "clean" | "bold" | "minimal";
  copyUsed: Record<string, string>;
  warnings: string[];
}

export default function AdminEmailSettingsPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;

  const providerStatus = useQuery(
    api.core.emails.service.getProviderStatus,
    {},
  ) as EmailProviderStatus | undefined;
  const senderOptions = useQuery(
    api.core.emails.service.getSenderOptions,
    orgId ? { orgId } : "skip",
  ) as EmailSenderOptions | undefined;
  const settings = useQuery(
    api.core.emails.service.getSettings,
    orgId ? { orgId } : "skip",
  ) as EmailSettings | null | undefined;

  const updateSettings = useMutation(api.core.emails.service.updateSettings);
  const ensureOverride = useMutation(
    api.core.emails.service.ensureTemplateOverrideForKey,
  );
  const previewWithOverrides = useAction(
    api.core.emails.reactEmailRender.previewTemplateByIdWithOverrides,
  );

  const [enabled, setEnabled] = useState(false);
  const [fromName, setFromName] = useState("");
  const [fromLocalPart, setFromLocalPart] = useState("");
  const [fromMode, setFromMode] = useState<"portal" | "custom">("portal");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [designKey, setDesignKey] = useState<"clean" | "bold" | "minimal">(
    "clean",
  );

  const [isSaving, setIsSaving] = useState(false);

  const [designPreviewTemplateId, setDesignPreviewTemplateId] =
    useState<Id<"emailTemplates"> | null>(null);
  const [designPreview, setDesignPreview] =
    useState<TemplatePreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setFromName(settings.fromName);
    setFromMode(settings.fromMode);
    setFromLocalPart(settings.fromLocalPart);
    setReplyToEmail(settings.replyToEmail ?? "");
    setDesignKey(settings.designKey ?? "clean");
  }, [settings]);

  const previewVars = useMemo(() => {
    const name = tenant?.name ?? "LaunchThat";
    return {
      appName: name,
      orgName: name,
      sentAt: new Date().toISOString(),
    };
  }, [tenant?.name]);

  useEffect(() => {
    if (!orgId) return;
    if (designPreviewTemplateId) return;
    void (async () => {
      try {
        const id = await ensureOverride({
          orgId,
          templateKey: "core.email.test",
        });
        setDesignPreviewTemplateId(id);
      } catch {
        // non-blocking
      }
    })();
  }, [designPreviewTemplateId, ensureOverride, orgId]);

  useEffect(() => {
    if (!orgId || !designPreviewTemplateId) return;
    let cancelled = false;
    setIsPreviewLoading(true);
    void (async () => {
      try {
        const result = (await previewWithOverrides({
          orgId,
          templateId: designPreviewTemplateId,
          variables: previewVars,
          overrides: {
            designOverrideKey: designKey,
          },
        })) as TemplatePreviewResult;
        if (cancelled) return;
        setDesignPreview(result);
      } catch {
        if (cancelled) return;
        setDesignPreview(null);
      } finally {
        if (cancelled) return;
        setIsPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    designKey,
    designPreviewTemplateId,
    orgId,
    previewVars,
    previewWithOverrides,
  ]);

  const portalDomain = senderOptions?.portalDomain ?? "launchthat.app";
  const customDomain = senderOptions?.customDomain ?? null;
  const canUseCustomDomain = senderOptions?.canUseCustomDomain ?? false;
  const customDomainStatus =
    senderOptions?.customDomainStatus ?? "unconfigured";
  const isCustomDomainVerified =
    customDomainStatus === "verified" && Boolean(customDomain);

  const computedFromEmail = useMemo(() => {
    const local = fromLocalPart.trim();
    if (!local) return "";
    if (fromMode === "portal") return `${local}@${portalDomain}`;
    if (!customDomain) return `${local}@${portalDomain}`;
    return `${local}@${customDomain}`;
  }, [customDomain, fromLocalPart, fromMode, portalDomain]);

  const handleSaveSettings = async () => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      await updateSettings({
        orgId,
        enabled,
        fromName,
        fromMode,
        fromLocalPart,
        replyToEmail: replyToEmail.length > 0 ? replyToEmail : undefined,
        designKey,
      });
      toast.success("Email settings saved");
    } catch (err) {
      toast.error("Failed to save email settings", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {fromMode === "custom" &&
      (!canUseCustomDomain || !isCustomDomainVerified) ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom sending domain not available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              To send from your own domain, you must verify the derived apex
              domain in Resend. Go to Domains to see the required DNS records
              and verification status.
            </p>
            <div className="flex">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/settings/domains">Go to Domains</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div>Resend</div>
            <div className="text-muted-foreground">
              {providerStatus?.resendConfigured
                ? "Configured"
                : "Missing RESEND_API_KEY"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sender identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sending domain</Label>
              <Select
                value={fromMode}
                onValueChange={(value) =>
                  setFromMode(value as "portal" | "custom")
                }
                disabled={!canUseCustomDomain}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portal">
                    Portal domain ({portalDomain})
                  </SelectItem>
                  <SelectItem value="custom">
                    Custom domain ({customDomain ?? "set up..."})
                  </SelectItem>
                </SelectContent>
              </Select>
              {!canUseCustomDomain ? (
                <div className="text-muted-foreground text-xs">
                  Custom sending domain is not available on your current plan.
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Org email design</Label>
              <Select
                value={designKey}
                onValueChange={(value) =>
                  setDesignKey(value as "clean" | "bold" | "minimal")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select design" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-xs">
                This is the default design used by all templates unless a
                template overrides it.
              </div>
              <div className="rounded-md border bg-white p-2">
                <div className="text-muted-foreground mb-2 text-xs">
                  Preview ({isPreviewLoading ? "loading…" : designKey})
                </div>
                <iframe
                  title="Design preview"
                  className="h-[260px] w-full rounded-md border bg-white"
                  srcDoc={designPreview?.html ?? ""}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable email</div>
              <div className="text-muted-foreground text-sm">
                When disabled, all sends are blocked for this org.
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={
                !providerStatus?.resendConfigured ||
                (fromMode === "custom" &&
                  (!canUseCustomDomain || !isCustomDomainVerified))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">From name</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="LaunchThat"
              />
            </div>
            <div className="space-y-2">
              <Label>From email</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={fromLocalPart}
                  onChange={(e) => setFromLocalPart(e.target.value)}
                  placeholder="info"
                  className="min-w-0"
                />
                <span className="text-muted-foreground">@</span>
                <div className="text-muted-foreground w-[220px] rounded-md border px-3 py-2 text-sm">
                  {fromMode === "portal"
                    ? portalDomain
                    : (customDomain ?? "not verified")}
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                Current:{" "}
                <span className="font-mono">
                  {computedFromEmail || "(empty)"}
                </span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="replyToEmail">Reply-to (optional)</Label>
              <Input
                id="replyToEmail"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="support@yourdomain.com"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!orgId || isSaving}
              onClick={() => void handleSaveSettings()}
            >
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
