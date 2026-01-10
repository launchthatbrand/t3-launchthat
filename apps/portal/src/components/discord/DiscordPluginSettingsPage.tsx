"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { OrganizationDiscordSettingsCard } from "./OrganizationDiscordSettingsCard";

export function DiscordPluginSettingsPage(props: {
  organizationId?: Id<"organizations">;
}) {
  const organizationId = props.organizationId;

  return (
    <div className="TEST container py-4">
      {organizationId ? (
        <OrganizationDiscordSettingsCard organizationId={organizationId} />
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            Discord settings are stored per organization. Select an organization
            first.
          </p>
          <Button asChild>
            <a href="/admin/settings/organizations">Go to Organizations</a>
          </Button>
        </div>
      )}
    </div>
  );
}
