"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plug } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import { OrganizationTabs } from "../_components/OrganizationTabs";

export default function PlatformOrganizationConnectionsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const base = `/platform/organization/${encodeURIComponent(organizationId)}/connections`;

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <OrganizationTabs />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base">Connections</CardTitle>
              <CardDescription>
                Manage org-level integrations (Discord, Telegram, etc). These are separate from broker
                connections.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
            >
              <Plug className="mr-1 h-3.5 w-3.5" />
              Org-scoped
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Discord</CardTitle>
              <CardDescription>
                Post trade ideas, announcements, and automations to Discord servers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground text-xs">
                Powered by <span className="font-mono">launchthat-plugin-discord</span>
              </div>
              <Button asChild variant="outline">
                <Link href={`${base}/discord`}>Manage</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Telegram</CardTitle>
              <CardDescription>
                Send alerts and summaries to Telegram channels (coming soon).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground text-xs">Not implemented yet.</div>
              <Button variant="outline" disabled>
                Coming soon
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

