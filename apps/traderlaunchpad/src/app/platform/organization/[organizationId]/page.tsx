"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { api } from "@convex-config/_generated/api";
import { OrganizationTabs } from "./_components/OrganizationTabs";

export default function PlatformOrganizationGeneralPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    organizationId ? { organizationId } : "skip",
  );

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

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {org === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : org === null ? (
            <div className="text-muted-foreground text-sm">Organization not found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Name</div>
                <div className="text-sm font-semibold">{org.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Slug</div>
                <div className="font-mono text-sm">{org.slug}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Owner</div>
                <div className="font-mono text-sm">{org.ownerId}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

