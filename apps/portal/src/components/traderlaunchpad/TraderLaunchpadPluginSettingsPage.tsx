"use client";

import type { Id } from "@/convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export const TraderLaunchpadPluginSettingsPage = (props: {
  organizationId?: Id<"organizations"> | string | null;
}) => {
  const organizationId = props.organizationId ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trader Launchpad</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Configure TradeLocker connections and Discord trade feeds.
          <div className="mt-2">
            Org:{" "}
            <span className="text-foreground font-medium">
              {organizationId ? String(organizationId) : "—"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
