"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Monitor, Smartphone } from "lucide-react";
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
import { Textarea } from "@acme/ui/textarea";

import { useTenant } from "~/context/TenantContext";

interface TemplatePreviewResult {
  subject: string;
  subjectTemplateUsed: string;
  html: string;
  text: string;
  designKey: "clean" | "bold" | "minimal";
  copyUsed: Record<string, string>;
  warnings: string[];
}

type DesignOverrideKey = "inherit" | "clean" | "bold" | "minimal";

interface CopyFieldDefinition {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  kind?: "singleLine" | "multiLine" | "url";
  maxLength?: number;
}

interface TemplateEditorQueryResult {
  template: {
    _id: Id<"emailTemplates">;
    templateKey: string;
    subjectOverride?: string;
    copyOverrides?: Record<string, string>;
    designOverrideKey?: DesignOverrideKey;
    createdAt: number;
    updatedAt: number;
  };
  definition: {
    templateKey: string;
    title: string;
    defaultSubject: string;
    copySchema: CopyFieldDefinition[];
    defaultCopy: Record<string, string>;
  };
  orgDesignKey: "clean" | "bold" | "minimal";
}

const getExampleVariablesForKey = (
  templateKey: string,
  sentAtIso: string,
): Record<string, string> => {
  if (templateKey === "core.email.test") {
    return {
      appName: "LaunchThat",
      orgName: "Wall Street Academy",
      sentAt: sentAtIso,
    };
  }
  if (templateKey === "core.userInvite") {
    return {
      appName: "LaunchThat",
      inviteeName: "Alex",
      inviteUrl: "https://launchthat.app/invite/example",
    };
  }
  return {
    appName: "LaunchThat",
    orgName: "Wall Street Academy",
  };
};

export default function AdminEmailTemplateEditorPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;
  const params = useParams<{ templateKey: string }>();
  const templateId = params.templateKey as Id<"emailTemplates">;
  const sentAtRef = useRef<string>(new Date().toISOString());
  const lastHydratedRef = useRef<string | null>(null);

  const loaded = useQuery(
    api.core.emails.service.getTemplateEditorById,
    orgId ? { orgId, templateId } : "skip",
  ) as TemplateEditorQueryResult | undefined;

  const exampleVars = useMemo(() => {
    if (!loaded) return null;
    return getExampleVariablesForKey(
      loaded.template.templateKey,
      sentAtRef.current,
    );
  }, [loaded?.template.templateKey, loaded]);

  const previewSaved = useAction(
    api.core.emails.reactEmailRender.previewTemplateById,
  );
  const previewUnsaved = useAction(
    api.core.emails.reactEmailRender.previewTemplateByIdWithOverrides,
  );
  const [previewState, setPreviewState] =
    useState<TemplatePreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewUnsavedChanges, setPreviewUnsavedChanges] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const previewDebounceRef = useRef<number | null>(null);

  const upsertTemplate = useMutation(api.core.emails.service.upsertTemplate);
  const sendTransactionalEmail = useAction(
    api.core.emails.reactEmailRender.sendTransactionalEmail,
  );

  const [subjectOverride, setSubjectOverride] = useState("");
  const [designOverrideKey, setDesignOverrideKey] =
    useState<DesignOverrideKey>("inherit");
  const [copyOverrides, setCopyOverrides] = useState<Record<string, string>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const hydrateKey = `${String(loaded.template._id)}:${loaded.template.updatedAt}`;
    if (lastHydratedRef.current === hydrateKey) return;
    lastHydratedRef.current = hydrateKey;
    setSubjectOverride(loaded.template.subjectOverride ?? "");
    setDesignOverrideKey(loaded.template.designOverrideKey ?? "inherit");
    setCopyOverrides(loaded.template.copyOverrides ?? {});
  }, [loaded?.template._id, loaded?.template.updatedAt, loaded]);

  useEffect(() => {
    if (!orgId || !loaded || !exampleVars) return;
    let cancelled = false;

    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
    }

    previewDebounceRef.current = window.setTimeout(
      () => {
        setIsPreviewLoading(true);
        setPreviewError(null);
        void (async () => {
          try {
            const result = previewUnsavedChanges
              ? ((await previewUnsaved({
                  orgId,
                  templateId,
                  variables: exampleVars,
                  overrides: {
                    subjectOverride:
                      subjectOverride.trim().length > 0
                        ? subjectOverride.trim()
                        : undefined,
                    copyOverrides,
                    designOverrideKey,
                  },
                })) as TemplatePreviewResult)
              : ((await previewSaved({
                  orgId,
                  templateId,
                  variables: exampleVars,
                })) as TemplatePreviewResult);
            if (cancelled) return;
            setPreviewState(result);
          } catch (err) {
            if (cancelled) return;
            setPreviewState(null);
            setPreviewError(err instanceof Error ? err.message : String(err));
          } finally {
            if (cancelled) return;
            setIsPreviewLoading(false);
          }
        })();
      },
      previewUnsavedChanges ? 350 : 0,
    );

    return () => {
      cancelled = true;
      if (previewDebounceRef.current) {
        window.clearTimeout(previewDebounceRef.current);
      }
    };
  }, [
    orgId,
    templateId,
    loaded?.template.updatedAt,
    previewSaved,
    previewUnsaved,
    exampleVars,
    previewUnsavedChanges,
    subjectOverride,
    designOverrideKey,
    copyOverrides,
  ]);

  const handleSave = async () => {
    if (!orgId) return;
    if (!loaded) return;
    setIsSaving(true);
    try {
      await upsertTemplate({
        orgId,
        templateKey: loaded.template.templateKey,
        subjectOverride:
          subjectOverride.trim().length > 0
            ? subjectOverride.trim()
            : undefined,
        copyOverrides,
        designOverrideKey,
      });
      toast.success("Template saved");
    } catch (err) {
      toast.error("Failed to save template", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (!loaded) return;
    setSubjectOverride(loaded.template.subjectOverride ?? "");
    setDesignOverrideKey(loaded.template.designOverrideKey ?? "inherit");
    setCopyOverrides(loaded.template.copyOverrides ?? {});
  };

  const handleResetAll = () => {
    setSubjectOverride("");
    setDesignOverrideKey("inherit");
    setCopyOverrides({});
  };

  const handleResetField = (key: string) => {
    setCopyOverrides((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const definition = loaded?.definition;
  const template = loaded?.template;
  const effectiveDesign =
    designOverrideKey === "inherit"
      ? loaded?.orgDesignKey
      : (designOverrideKey);

  const effectiveSubjectPreview = useMemo(() => {
    if (!definition) return "";
    return subjectOverride.trim().length > 0
      ? subjectOverride.trim()
      : definition.defaultSubject;
  }, [definition, subjectOverride]);

  const iframeWidth = previewDevice === "mobile" ? 375 : 680;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/settings/emails/templates">←</Link>
            </Button>
            <div className="font-medium">
              {definition?.title ?? "Email template"}
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            <span className="font-mono">
              {template ? template.templateKey : String(templateId)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!template || isSaving}
            onClick={handleRevert}
          >
            Revert
          </Button>
          <Button
            type="button"
            disabled={!orgId || !template || isSaving}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectOverride">Subject</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subjectOverride"
                  value={subjectOverride}
                  onChange={(e) => setSubjectOverride(e.target.value)}
                  placeholder={definition?.defaultSubject ?? "Subject line"}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubjectOverride("")}
                >
                  Reset
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                Leave empty to use the default. Variables use{" "}
                <code>{"{{varName}}"}</code>.
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email design</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={designOverrideKey}
                  onValueChange={(value) =>
                    setDesignOverrideKey(value as DesignOverrideKey)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select design" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">
                      Inherit ({loaded?.orgDesignKey ?? "clean"})
                    </SelectItem>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDesignOverrideKey("inherit")}
                >
                  Reset
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                Effective:{" "}
                <span className="font-mono">{effectiveDesign ?? "…"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">
                  Preview unsaved changes
                </div>
                <div className="text-muted-foreground text-xs">
                  When enabled, preview updates as you type.
                </div>
              </div>
              <Switch
                checked={previewUnsavedChanges}
                onCheckedChange={setPreviewUnsavedChanges}
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleResetAll}>
                Reset all overrides
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium">Copy fields</div>
              <div className="text-muted-foreground text-xs">
                Leave empty to use defaults. Variables use{" "}
                <code>{"{{varName}}"}</code>.
              </div>
            </div>

            {definition?.copySchema.length ? (
              <div className="space-y-4">
                {definition.copySchema.map((field) => {
                  const value = copyOverrides[field.key] ?? "";
                  const isOverridden = field.key in copyOverrides;
                  const isMultiline =
                    field.multiline || field.kind === "multiLine";

                  const inputEl = isMultiline ? (
                    <Textarea
                      id={`copy-${field.key}`}
                      value={value}
                      onChange={(e) =>
                        setCopyOverrides((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="min-h-28"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      id={`copy-${field.key}`}
                      value={value}
                      onChange={(e) =>
                        setCopyOverrides((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  );

                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`copy-${field.key}`}>
                          {field.label}
                        </Label>
                        <div className="flex items-center gap-2">
                          {isOverridden ? (
                            <div className="text-muted-foreground text-xs">
                              Overridden
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs">
                              Default
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetField(field.key)}
                            disabled={!isOverridden}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                      {inputEl}
                      {field.description ? (
                        <div className="text-muted-foreground text-xs">
                          {field.description}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No editable copy fields for this template.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Email preview</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="icon"
                  aria-label="Desktop preview"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="icon"
                  aria-label="Mobile preview"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
              <div className="space-y-2">
                <Label htmlFor="testRecipient">Send test email</Label>
                <Input
                  id="testRecipient"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="you@example.com"
                />
                <div className="text-muted-foreground text-xs">
                  Uses this template with example variables.
                </div>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  disabled={
                    !orgId ||
                    !loaded ||
                    !exampleVars ||
                    isSendingTest ||
                    testRecipient.trim().length === 0
                  }
                  onClick={() => {
                    if (!orgId || !loaded || !exampleVars) return;
                    void (async () => {
                      setIsSendingTest(true);
                      try {
                        const outboxId = await sendTransactionalEmail({
                          orgId,
                          to: testRecipient.trim(),
                          templateKey: loaded.template.templateKey,
                          variables: exampleVars,
                        });
                        toast.success("Test email queued", {
                          description: String(outboxId),
                        });
                      } catch (err) {
                        toast.error("Failed to send test email", {
                          description:
                            err instanceof Error ? err.message : String(err),
                        });
                      } finally {
                        setIsSendingTest(false);
                      }
                    })();
                  }}
                >
                  Send a test email
                </Button>
              </div>
            </div>

            {previewError ? (
              <div className="text-destructive text-sm">{previewError}</div>
            ) : null}
            {previewState?.warnings.length ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Warnings</div>
                <ul className="text-muted-foreground list-disc pl-5">
                  {previewState.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="text-sm font-medium">Subject</div>
              <div className="bg-card rounded-md border px-3 py-2 text-sm">
                {isPreviewLoading ? "Loading…" : (previewState?.subject ?? "—")}
              </div>
              <div className="text-muted-foreground text-xs">
                Template:{" "}
                <span className="font-mono">
                  {previewState?.subjectTemplateUsed ??
                    effectiveSubjectPreview ??
                    "—"}
                </span>
              </div>
            </div>

            <div className="rounded-md border bg-white p-2">
              <div className="flex justify-center">
                <div style={{ width: `${iframeWidth}px`, maxWidth: "100%" }}>
                  <iframe
                    title="Template HTML preview"
                    className="h-[720px] w-full rounded-md border bg-white"
                    srcDoc={previewState?.html ?? ""}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Text body</div>
              <Textarea
                value={previewState?.text ?? ""}
                readOnly
                className="min-h-[200px] font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
