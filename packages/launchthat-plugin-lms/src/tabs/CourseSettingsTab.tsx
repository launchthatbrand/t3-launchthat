"use client";

import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type {
  CourseAccessMode,
  CourseProgressionMode,
  CourseSettings,
} from "../constants/courseSettings";
import type { Id } from "../lib/convexId";
import {
  buildCourseSettingsOptionKey,
  DEFAULT_COURSE_SETTINGS,
} from "../constants/courseSettings";

const ACCESS_MODE_OPTIONS: {
  value: CourseAccessMode;
  label: string;
  description: string;
}[] = [
  {
    value: "open",
    label: "Open",
    description:
      "Not protected. Any visitor can access the course without login or enrollment.",
  },
  {
    value: "free",
    label: "Free",
    description:
      "Requires registration and enrollment, but no payment is collected.",
  },
  {
    value: "buy_now",
    label: "Buy now",
    description:
      "Learners purchase the course once via Stripe/PayPal before accessing content.",
  },
  {
    value: "recurring",
    label: "Recurring",
    description:
      "Learners subscribe to a recurring payment plan via Stripe/PayPal.",
  },
  {
    value: "closed",
    label: "Closed",
    description:
      "Only admins, groups, or integrations can enroll users. No purchase button is shown.",
  },
];

const PROGRESSION_OPTIONS: {
  value: CourseProgressionMode;
  label: string;
  description: string;
}[] = [
  {
    value: "linear",
    label: "Linear",
    description: "Learners must complete lessons in the provided order.",
  },
  {
    value: "freeform",
    label: "Free form",
    description: "Learners can open lessons in any order they prefer.",
  },
];

const toDatetimeInputValue = (iso?: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

const fromDatetimeInputValue = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export const CourseSettingsTab = ({
  postId,
  organizationId,
  pluginName,
}: PluginSingleViewComponentProps) => {
  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;
  const optionKey = postId ? buildCourseSettingsOptionKey(postId) : null;
  const optionsArgs =
    optionKey && normalizedOrganizationId
      ? {
          metaKey: optionKey,
          type: "site" as const,
          orgId: normalizedOrganizationId,
        }
      : "skip";
  const canPersist = optionsArgs !== "skip";

  const existingOption = useQuery(
    api.core.options.get,
    optionsArgs === "skip" ? "skip" : optionsArgs,
  );
  const setOption = useMutation(api.core.options.set);

  const resolvedSettings: CourseSettings = useMemo(() => {
    if (
      existingOption &&
      existingOption.metaValue &&
      typeof existingOption.metaValue === "object"
    ) {
      return {
        ...DEFAULT_COURSE_SETTINGS,
        ...(existingOption.metaValue as Partial<CourseSettings>),
      };
    }
    return DEFAULT_COURSE_SETTINGS;
  }, [existingOption]);

  const [settings, setSettings] = useState<CourseSettings>(resolvedSettings);
  const [prereqInput, setPrereqInput] = useState(
    resolvedSettings.prerequisites.join(", "),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(resolvedSettings);
    setPrereqInput(resolvedSettings.prerequisites.join(", "));
  }, [resolvedSettings]);

  const handleChange = useCallback(
    <Key extends keyof CourseSettings>(
      key: Key,
      value: CourseSettings[Key],
    ) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handlePrereqChange = useCallback((value: string) => {
    setPrereqInput(value);
    const tokens = value
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
    setSettings((prev) => ({
      ...prev,
      prerequisites: tokens,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canPersist || !optionKey || !normalizedOrganizationId) {
      return;
    }
    setIsSaving(true);
    try {
      await setOption({
        metaKey: optionKey,
        metaValue: settings,
        type: "site",
        orgId: normalizedOrganizationId,
      });
      toast.success("Course settings saved", {
        description: `Stored via ${pluginName}.`,
      });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Unable to save settings.";
      toast.error("Save failed", { description });
    } finally {
      setIsSaving(false);
    }
  }, [canPersist, optionKey, organizationId, pluginName, setOption, settings]);

  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save required</CardTitle>
          <CardDescription>
            Save this course first, then reopen the Settings tab to configure
            access and progression options.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!normalizedOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization required</CardTitle>
          <CardDescription>
            Settings are stored per-organization. Please reload this page after
            selecting a tenant or organization.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Fine tune enrollment, prerequisites, pacing, and expirations for
            this course.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSettings(resolvedSettings);
              setPrereqInput(resolvedSettings.prerequisites.join(", "));
            }}
            disabled={isSaving}
          >
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit uppercase">
            Access
          </Badge>
          <CardTitle>Course access settings</CardTitle>
          <CardDescription>
            Control how learners enroll and when they can see content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <Label>Access mode</Label>
            <p className="text-muted-foreground text-sm">
              Choose the enrollment model that best fits this course.
            </p>
            <RadioGroup
              value={settings.accessMode}
              onValueChange={(value: CourseAccessMode) =>
                handleChange("accessMode", value)
              }
              className="space-y-3"
            >
              {ACCESS_MODE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div>
                    <Label htmlFor={option.value}>{option.label}</Label>
                    <p className="text-muted-foreground text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-prerequisites">Course prerequisites</Label>
              <Textarea
                id="course-prerequisites"
                value={prereqInput}
                onChange={(event) => handlePrereqChange(event.target.value)}
                placeholder="Enter prerequisite course slugs separated by commas"
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Learners must complete these courses before enrolling.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-points">Course points</Label>
              <Input
                id="course-points"
                type="number"
                min={0}
                value={settings.coursePoints}
                onChange={(event) =>
                  handleChange("coursePoints", Number(event.target.value) || 0)
                }
              />
              <p className="text-muted-foreground text-xs">
                Used to award points upon completion. Supports integers only.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Course access expiration</Label>
                <p className="text-muted-foreground text-sm">
                  Optionally close access after a start or end date.
                </p>
              </div>
              <Switch
                checked={settings.accessExpirationEnabled}
                onCheckedChange={(checked) =>
                  handleChange("accessExpirationEnabled", checked)
                }
              />
            </div>
            {settings.accessExpirationEnabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="access-start">Start date</Label>
                  <Input
                    id="access-start"
                    type="datetime-local"
                    value={toDatetimeInputValue(settings.accessStart)}
                    onChange={(event) =>
                      handleChange(
                        "accessStart",
                        fromDatetimeInputValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-end">End date</Label>
                  <Input
                    id="access-end"
                    type="datetime-local"
                    value={toDatetimeInputValue(settings.accessEnd)}
                    onChange={(event) =>
                      handleChange(
                        "accessEnd",
                        fromDatetimeInputValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-limit">Student limit</Label>
                  <Input
                    id="student-limit"
                    type="number"
                    min={0}
                    value={settings.studentLimit ?? ""}
                    onChange={(event) =>
                      handleChange(
                        "studentLimit",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value) || 0,
                      )
                    }
                    placeholder="Unlimited"
                  />
                  <p className="text-muted-foreground text-xs">
                    Leave blank for unlimited seats.
                  </p>
                </div>
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit uppercase">
            Navigation
          </Badge>
          <CardTitle>Course navigation settings</CardTitle>
          <CardDescription>
            Decide how learners progress through lessons and topics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.progressionMode}
            onValueChange={(value: CourseProgressionMode) =>
              handleChange("progressionMode", value)
            }
            className="space-y-3"
          >
            {PROGRESSION_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div>
                  <Label htmlFor={option.value}>{option.label}</Label>
                  <p className="text-muted-foreground text-sm">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
};
