"use client";

import React from "react";
import { useParams } from "next/navigation";

import { Badge } from "@acme/ui/badge";

import { OrganizationTabs } from "../../../_components/OrganizationTabs";
import { PlatformDiscordAdminClient } from "./DiscordAdminClient";

export default function PlatformOrganizationDiscordConnectionsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
          <Badge variant="outline" className="font-mono">
            {organizationId || "—"}
          </Badge>
        </div>
        <OrganizationTabs />
      </div>

      {organizationId ? (
        <PlatformDiscordAdminClient organizationId={organizationId} />
      ) : (
        <div className="text-muted-foreground text-sm">Missing organization id.</div>
      )}
    </div>
  );
}

