"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { applyFilters } from "@acme/admin-runtime/hooks";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";
import {
  FRONTEND_NOTIFICATION_CHANNELS_FILTER,
  FRONTEND_NOTIFICATION_EVENT_DEFINITIONS_FILTER,
} from "~/lib/plugins/hookSlots";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export function NotificationSettingsTab() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const { convexId: userId, isLoading: userLoading } = useConvexUser();

  type ChannelKey = "inApp" | "email";
  interface ChannelDefinition {
    key: ChannelKey;
    label: string;
    description?: string;
  }
  interface EventDefinition {
    eventKey: string;
    label: string;
    description?: string;
  }

  const filterCtx = useMemo(
    () => ({
      organizationId: organizationId ?? null,
      userId: userId ?? null,
    }),
    [organizationId, userId],
  );

  const defaultChannels: ChannelDefinition[] = useMemo(
    () => [
      { key: "inApp", label: "In app" },
      { key: "email", label: "Email" },
    ],
    [],
  );
  const channels = useMemo(() => {
    const filtered = applyFilters(
      FRONTEND_NOTIFICATION_CHANNELS_FILTER,
      defaultChannels,
      filterCtx,
    );
    return Array.isArray(filtered)
      ? (filtered as ChannelDefinition[])
      : defaultChannels;
  }, [defaultChannels, filterCtx]);

  const knownKeys = useQuery(
    api.core.notifications.settings.listKnownEventKeysForOrg,
    organizationId && userId
      ? { orgId: organizationId as Id<"organizations">, userId }
      : "skip",
  ) as string[] | undefined;

  const orgDefaults = useQuery(
    api.core.notifications.settings.getOrgDefaults,
    organizationId ? { orgId: organizationId as Id<"organizations"> } : "skip",
  ) as
    | {
        inAppDefaults: Record<string, boolean>;
        emailDefaults: Record<string, boolean>;
      }
    | undefined;

  const userPrefs = useQuery(
    api.core.notifications.settings.getUserEventPrefs,
    organizationId && userId
      ? { orgId: organizationId as Id<"organizations">, userId }
      : "skip",
  ) as
    | {
        inAppEnabled: Record<string, boolean>;
        emailEnabled: Record<string, boolean>;
      }
    | undefined;

  const savePrefs = useMutation(
    api.core.notifications.settings.setUserEventPrefs,
  );

  const humanizeKey = (key: string) => {
    const normalized = (key ?? "").trim();
    if (!normalized) return "Notification";
    return normalized
      .split(/[._/-]+/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const baseEvents = useMemo<EventDefinition[]>(() => {
    const keys = Array.isArray(knownKeys) ? knownKeys : [];
    return keys.map((eventKey) => ({
      eventKey,
      label:
        eventKey === "lms.course.stepAdded"
          ? "New course step added"
          : humanizeKey(eventKey),
      description:
        eventKey === "lms.course.stepAdded"
          ? "A new lesson/step was added to a course."
          : undefined,
    }));
  }, [knownKeys]);

  const events = useMemo(() => {
    const filtered = applyFilters(
      FRONTEND_NOTIFICATION_EVENT_DEFINITIONS_FILTER,
      baseEvents,
      filterCtx,
    );
    return Array.isArray(filtered)
      ? (filtered as EventDefinition[])
      : baseEvents;
  }, [baseEvents, filterCtx]);

  const [draftInApp, setDraftInApp] = useState<Record<string, boolean>>({});
  const [draftEmail, setDraftEmail] = useState<Record<string, boolean>>({});

  const effectiveInApp = (eventKey: string) => {
    if (eventKey in draftInApp) return Boolean(draftInApp[eventKey]);
    if (userPrefs?.inAppEnabled && eventKey in userPrefs.inAppEnabled) {
      return Boolean(userPrefs.inAppEnabled[eventKey]);
    }
    if (orgDefaults?.inAppDefaults && eventKey in orgDefaults.inAppDefaults) {
      return Boolean(orgDefaults.inAppDefaults[eventKey]);
    }
    return true;
  };

  const effectiveEmail = (eventKey: string) => {
    if (eventKey in draftEmail) return Boolean(draftEmail[eventKey]);
    if (userPrefs?.emailEnabled && eventKey in userPrefs.emailEnabled) {
      return Boolean(userPrefs.emailEnabled[eventKey]);
    }
    if (orgDefaults?.emailDefaults && eventKey in orgDefaults.emailDefaults) {
      return Boolean(orgDefaults.emailDefaults[eventKey]);
    }
    return false;
  };

  const isReady =
    !userLoading &&
    Boolean(organizationId) &&
    Boolean(userId) &&
    userPrefs !== undefined &&
    orgDefaults !== undefined &&
    knownKeys !== undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground">
            Manage your notification preferences.
          </div>
          <Separator />
          {!isReady ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : events.length === 0 ? (
            <div className="text-muted-foreground">
              No notification types yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div className="text-xs font-medium">Notification type</div>
                {channels.map((c) => (
                  <div
                    key={c.key}
                    className="text-xs font-medium md:text-center"
                  >
                    {c.label}
                  </div>
                ))}
              </div>

              {events.map((evt) => (
                <div
                  key={evt.eventKey}
                  className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{evt.label}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {evt.eventKey}
                    </div>
                    {evt.description ? (
                      <div className="text-muted-foreground text-xs">
                        {evt.description}
                      </div>
                    ) : null}
                  </div>

                  {channels.map((c) => {
                    const checked =
                      c.key === "inApp"
                        ? effectiveInApp(evt.eventKey)
                        : effectiveEmail(evt.eventKey);
                    return (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-2 md:justify-center"
                      >
                        <span className="text-muted-foreground text-xs md:hidden">
                          {c.label}
                        </span>
                        <Switch
                          checked={checked}
                          onCheckedChange={(next) => {
                            if (c.key === "inApp") {
                              setDraftInApp((prev) => ({
                                ...prev,
                                [evt.eventKey]: Boolean(next),
                              }));
                            } else {
                              setDraftEmail((prev) => ({
                                ...prev,
                                [evt.eventKey]: Boolean(next),
                              }));
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (!organizationId || !userId) return;
                    const inAppEnabled = {
                      ...(userPrefs?.inAppEnabled ?? {}),
                      ...draftInApp,
                    };
                    const emailEnabled = {
                      ...(userPrefs?.emailEnabled ?? {}),
                      ...draftEmail,
                    };
                    await savePrefs({
                      orgId: organizationId as Id<"organizations">,
                      userId,
                      inAppEnabled,
                      emailEnabled,
                    });
                    setDraftInApp({});
                    setDraftEmail({});
                  }}
                  disabled={
                    Object.keys(draftInApp).length === 0 &&
                    Object.keys(draftEmail).length === 0
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default NotificationSettingsTab;
