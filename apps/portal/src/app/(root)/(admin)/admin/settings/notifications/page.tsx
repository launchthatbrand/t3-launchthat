"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";

import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";
import {
  buildNotificationEventCatalog,
  groupCatalogByCategory,
} from "~/lib/notifications/notificationCatalog";

export default function AdminNotificationSettingsPage() {
  const { user: convexUser } = useConvexUser();
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;

  const convexUserDoc = convexUser as Doc<"users"> | null | undefined;

  const catalog = useMemo(() => buildNotificationEventCatalog(), []);
  const grouped = useMemo(() => groupCatalogByCategory(catalog), [catalog]);

  const orgDefaults = useQuery(
    api.core.notifications.settings.getOrgDefaults,
    orgId ? { orgId } : "skip",
  ) as { inAppDefaults?: Record<string, boolean> } | null | undefined;

  const setOrgDefaults = useMutation(api.core.notifications.settings.setOrgDefaults);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (eventKey: string, enabled: boolean) => {
    if (!orgId || !convexUserDoc?._id) return;
    const next: Record<string, boolean> = {
      ...(orgDefaults?.inAppDefaults ?? {}),
      [eventKey]: enabled,
    };
    setIsSaving(true);
    try {
      await setOrgDefaults({
        orgId,
        actorUserId: convexUserDoc._id,
        inAppDefaults: next,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-end">
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
                const stored = orgDefaults?.inAppDefaults?.[item.eventKey];
                const defaultValue = stored ?? item.defaultInAppEnabled ?? true;

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
                      disabled={!orgId || !convexUserDoc || isSaving}
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
