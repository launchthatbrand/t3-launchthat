"use client";

import React from "react";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";
import { getDiscordAdminRoute } from "../router/routes";

export function DiscordOverviewPage({
  api,
  organizationId,
  basePath = "/admin/discord",
  className,
}: DiscordPageProps) {
  const orgConfig = useQuery(
    api.queries.getOrgConfig,
    organizationId ? { organizationId } : {},
  );
  const guildConnections = useQuery(
    api.queries.listGuildConnectionsForOrg,
    organizationId ? { organizationId } : {},
  );

  const enabled = orgConfig?.enabled ?? false;
  const botMode = orgConfig?.botMode ?? "global";
  const guildCount = Array.isArray(guildConnections)
    ? guildConnections.length
    : 0;

  return (
    <div className={className}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Discord overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor Discord connectivity, routing, and account linkage.
          </p>
        </div>
        <Button asChild>
          <a href={getDiscordAdminRoute(basePath, ["connections"])}>
            Manage connections
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Bot mode:{" "}
              <span className="font-medium text-foreground">{botMode}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Connected guilds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{guildCount}</p>
            <p className="text-sm text-muted-foreground">
              Active Discord servers connected.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Connect a guild, set trade feed channels, and customize templates.</p>
            <Button variant="outline" asChild>
              <a href={getDiscordAdminRoute(basePath, ["templates"])}>
                Customize templates
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
