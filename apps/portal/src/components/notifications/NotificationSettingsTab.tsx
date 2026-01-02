"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";

import { useTenant } from "~/context/TenantContext";
import {
  buildNotificationEventCatalog,
  groupCatalogByCategory,
} from "~/lib/notifications/notificationCatalog";

export function NotificationSettingsTab() {
  const { user } = useClerk();
  const clerkId = user?.id;
  const tenant = useTenant();
  const orgId = tenant?._id;

  const convexUser = useQuery(
    api.core.users.queries.getUserByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  const catalog = useMemo(() => buildNotificationEventCatalog(), []);
  const grouped = useMemo(() => groupCatalogByCategory(catalog), [catalog]);

  const userPrefs = useQuery(
    api.notifications.settings.getUserEventPrefs,
    convexUser && orgId
      ? { userId: convexUser._id as any, orgId: orgId as any }
      : "skip",
  );

  const orgDefaults = useQuery(
    api.notifications.settings.getOrgDefaults,
    orgId ? { orgId: orgId as any } : "skip",
  );

  const setUserEventPrefs = useMutation(api.notifications.settings.setUserEventPrefs);
  const upsertSubscription = useMutation(api.notifications.settings.upsertSubscription);

  const lmsCourses = useQuery(
    api.plugins.lms.queries.listCourses,
    orgId ? { organizationId: orgId as any } : "skip",
  );
  const lmsSubs = useQuery(
    api.notifications.settings.listSubscriptions,
    convexUser && orgId
      ? {
          userId: convexUser._id as any,
          orgId: orgId as any,
          eventKey: "lms.course.stepAdded",
        }
      : "skip",
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    if (!convexUser || !orgId) return;

    const next = {
      ...(userPrefs?.inAppEnabled ?? {}),
      [eventKey]: enabled,
    };

    setIsSaving(true);
    try {
      await setUserEventPrefs({
        userId: convexUser._id as any,
        orgId: orgId as any,
        inAppEnabled: next,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCourseSub = async (scopeId: string | null, enabled: boolean) => {
    if (!convexUser || !orgId) return;
    setIsSaving(true);
    try {
      await upsertSubscription({
        userId: convexUser._id as any,
        orgId: orgId as any,
        eventKey: "lms.course.stepAdded",
        scopeKind: "course",
        scopeId,
        enabled,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCourseSub = async () => {
    if (!selectedCourseId) return;
    await handleToggleCourseSub(selectedCourseId, true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Notification settings</div>
          <div className="text-muted-foreground text-sm">In-app notifications only.</div>
        </div>
        <Button variant="outline" disabled>
          Saved automatically
        </Button>
      </div>

      {Object.entries(grouped).map(([category, items]) => {
        if (!items.length) return null;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category === "lms" ? (
                <div className="border-border space-y-3 rounded-md border p-3">
                  <div className="font-medium">Course step notifications</div>
                  <div className="text-muted-foreground text-sm">
                    Choose whether you want to be notified when a new course step is added to any
                    course or specific courses.
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">Any course</div>
                      <div className="text-muted-foreground text-sm">
                        Notify me when a new step is added to any course.
                      </div>
                    </div>
                    <Switch
                      checked={!!lmsSubs?.some((s: any) => s.scopeId === null && s.enabled)}
                      disabled={!convexUser || !orgId || isSaving}
                      onCheckedChange={(checked) => void handleToggleCourseSub(null, checked)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <Select
                        value={selectedCourseId}
                        onValueChange={setSelectedCourseId}
                        disabled={!Array.isArray(lmsCourses) || lmsCourses.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course…" />
                        </SelectTrigger>
                        <SelectContent>
                          {(lmsCourses ?? []).map((course: any) => (
                            <SelectItem key={course._id} value={course._id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedCourseId || isSaving || !convexUser || !orgId}
                      onClick={() => void handleAddCourseSub()}
                    >
                      Add course subscription
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(lmsSubs ?? [])
                      .filter((s: any) => s.scopeId !== null)
                      .map((sub: any) => {
                        const courseTitle =
                          (lmsCourses ?? []).find((c: any) => c._id === sub.scopeId)?.title ??
                          sub.scopeId;
                        return (
                          <div
                            key={sub._id}
                            className="flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="font-medium">{courseTitle}</div>
                              <div className="text-muted-foreground text-sm">
                                Notify me for this course only.
                              </div>
                            </div>
                            <Switch
                              checked={sub.enabled}
                              disabled={!convexUser || !orgId || isSaving}
                              onCheckedChange={(checked) =>
                                void handleToggleCourseSub(sub.scopeId as any, checked)
                              }
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}

              {items.map((item) => {
                const userOverride = (userPrefs as any)?.inAppEnabled?.[item.eventKey];
                const orgDefault = (orgDefaults as any)?.inAppDefaults?.[item.eventKey];
                const effective =
                  typeof userOverride === "boolean"
                    ? userOverride
                    : typeof orgDefault === "boolean"
                      ? orgDefault
                      : item.defaultInAppEnabled ?? true;

                return (
                  <div key={item.eventKey} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description ? (
                        <div className="text-muted-foreground text-sm">{item.description}</div>
                      ) : null}
                      <div className="text-muted-foreground mt-1 text-xs">{item.pluginName}</div>
                    </div>
                    <Switch
                      checked={effective}
                      disabled={!convexUser || !orgId || isSaving}
                      onCheckedChange={(checked) => void handleToggle(item.eventKey, checked)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


