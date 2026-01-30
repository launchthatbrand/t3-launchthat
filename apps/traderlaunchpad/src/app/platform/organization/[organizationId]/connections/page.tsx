"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Plug } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import { api } from "@convex-config/_generated/api";
import { OrganizationTabs } from "../_components/OrganizationTabs";

export default function PlatformOrganizationConnectionsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const base = `/platform/organization/${encodeURIComponent(organizationId)}/connections`;
  const guildConnections = useQuery(api.discord.queries.listGuildConnectionsForOrg, {
    organizationId,
  });

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

        <CardContent className="grid gap-4 p-4">
          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Discord connections</CardTitle>
              <CardDescription>
                Discord guilds connected for this organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray(guildConnections) && guildConnections.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {guildConnections.map((guild) => (
                    <Card key={guild.guildId} className="border-border/40">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">
                            {guild.guildName ?? "Discord server"}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {guild.guildId}
                          </div>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`${base}/discord/${guild.guildId}`}>Manage</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No Discord guilds connected yet.
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="text-muted-foreground text-xs">
                  Powered by <span className="font-mono">launchthat-plugin-discord</span>
                </div>
                <Button asChild variant="outline">
                  <Link href={`${base}/discord`}>Open Discord admin</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/3 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Telegram connections</CardTitle>
              <CardDescription>
                Telegram channels connected for this organization.
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

