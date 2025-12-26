"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";

import { useTenant } from "~/context/TenantContext";
import {
  buildNotificationEventCatalog,
  groupCatalogByCategory,
} from "~/lib/notifications/notificationCatalog";

export default function AdminNotificationSettingsPage() {
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

  const orgDefaults = useQuery(
    api.notifications.settings.getOrgDefaults,
    orgId ? { orgId: orgId as any } : "skip",
  );

  const setOrgDefaults = useMutation(api.notifications.settings.setOrgDefaults);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    if (!orgId || !convexUser) return;
    const next = {
      ...(orgDefaults?.inAppDefaults ?? {}),
      [eventKey]: enabled,
    };
    setIsSaving(true);
    try {
      await setOrgDefaults({
        orgId: orgId as any,
        actorUserId: convexUser._id as any,
        inAppDefaults: next,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Organization notification defaults
          </h1>
          <p className="text-muted-foreground text-sm">
            These are the default in-app notification settings for this
            organization.
          </p>
        </div>
        <Button variant="outline" disabled>
          Saved automatically
        </Button>
      </div>

      {Object.entries(grouped).map(([category, items]) => {
        if (!items.length) return null;
        return (
          <Card key={category} className="mb-4">
            <CardHeader>
              <CardTitle className="capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const defaultValue =
                  orgDefaults?.inAppDefaults?.[item.eventKey] ??
                  item.defaultInAppEnabled ??
                  true;

                return (
                  <div
                    key={item.eventKey}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description ? (
                        <div className="text-muted-foreground text-sm">
                          {item.description}
                        </div>
                      ) : null}
                      <div className="text-muted-foreground mt-1 text-xs">
                        {item.pluginName}
                      </div>
                    </div>
                    <Switch
                      checked={!!defaultValue}
                      disabled={!orgId || !convexUser || isSaving}
                      onCheckedChange={(checked) =>
                        void handleToggle(item.eventKey, checked)
                      }
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


