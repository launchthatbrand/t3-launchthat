"use client";

import React from "react";
import { useParams } from "next/navigation";

import { Badge } from "@acme/ui/badge";

import { AdminOrgDiscordAdminClient } from "./DiscordAdminClient";

export default function AdminOrganizationDiscordConnectionsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Discord</h2>
          <Badge variant="outline" className="font-mono">
            {organizationId || "—"}
          </Badge>
        </div>
      </div>

      {organizationId ? (
        <AdminOrgDiscordAdminClient organizationId={organizationId} />
      ) : (
        <div className="text-muted-foreground text-sm">Missing organization id.</div>
      )}
    </div>
  );
}

