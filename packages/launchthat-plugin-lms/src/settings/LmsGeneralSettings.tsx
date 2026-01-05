"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "sonner";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

const apiAny = api as any;

const SETTINGS_META_KEY = "plugin.lms.settings";

type LmsSettings = {
  title: string;
  description: string;
  enablePrerequisites: boolean;
  adminBypassCourseAccess: boolean;
};

const defaultSettings: LmsSettings = {
  title: "Learning Portal",
  description: "Configure the default LMS branding and learner experience.",
  enablePrerequisites: true,
  adminBypassCourseAccess: false,
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const LmsGeneralSettings = ({
  pluginName,
  organizationId,
}: PluginSettingComponentProps) => {
  const orgId = organizationId ? String(organizationId) : undefined;

  const stored = useQuery(apiAny.core.options.get, {
    metaKey: SETTINGS_META_KEY,
    type: "site",
    orgId: organizationId ?? null,
  }) as { metaValue?: unknown } | null | undefined;

  const setOption = useMutation(apiAny.core.options.set) as (args: {
    metaKey: string;
    metaValue: unknown;
    type?: "store" | "site";
    orgId?: string | null;
  }) => Promise<string>;

  const resolved = useMemo<LmsSettings>(() => {
    const v = stored?.metaValue as Partial<LmsSettings> | undefined;
    const title = asString(v?.title).trim();
    const description = asString(v?.description).trim();
    return {
      title: title.length > 0 ? title : defaultSettings.title,
      description:
        description.length > 0 ? description : defaultSettings.description,
      enablePrerequisites:
        typeof v?.enablePrerequisites === "boolean"
          ? v.enablePrerequisites
          : defaultSettings.enablePrerequisites,
      adminBypassCourseAccess:
        typeof v?.adminBypassCourseAccess === "boolean"
          ? v.adminBypassCourseAccess
          : defaultSettings.adminBypassCourseAccess,
    };
  }, [stored]);

  const [isSaving, startTransition] = useTransition();
  const [title, setTitle] = useState(resolved.title);
  const [description, setDescription] = useState(resolved.description);
  const [enablePrerequisites, setEnablePrerequisites] = useState(
    resolved.enablePrerequisites,
  );
  const [adminBypassCourseAccess, setAdminBypassCourseAccess] = useState(
    resolved.adminBypassCourseAccess,
  );

  useEffect(() => {
    setTitle(resolved.title);
    setDescription(resolved.description);
    setEnablePrerequisites(resolved.enablePrerequisites);
    setAdminBypassCourseAccess(resolved.adminBypassCourseAccess);
  }, [resolved]);

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await setOption({
          metaKey: SETTINGS_META_KEY,
          type: "site",
          orgId: (orgId ?? null) as any,
          metaValue: {
            title: title.trim() || defaultSettings.title,
            description: description.trim() || defaultSettings.description,
            enablePrerequisites,
            adminBypassCourseAccess,
          } satisfies LmsSettings,
        });
        toast.success(`${pluginName} settings saved`);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save settings",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="lms-title">Portal name</Label>
          <Input
            id="lms-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Acme Learning"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lms-description">Description</Label>
          <Textarea
            id="lms-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <Label className="text-base">Enable course prerequisites</Label>
            <p className="text-sm text-muted-foreground">
              Learners must finish the previous lesson before continuing.
            </p>
          </div>
          <Switch
            checked={enablePrerequisites}
            onCheckedChange={setEnablePrerequisites}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <Label className="text-base">
              Administrators bypass all course access rules
            </Label>
            <p className="text-sm text-muted-foreground">
              If enabled, admins can view locked lessons/topics/quizzes without
              enrolling or purchasing.
            </p>
          </div>
          <Switch
            checked={adminBypassCourseAccess}
            onCheckedChange={setAdminBypassCourseAccess}
          />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
};

