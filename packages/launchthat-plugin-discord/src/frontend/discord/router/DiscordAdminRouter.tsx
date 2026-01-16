"use client";

import React from "react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { DiscordLinkComponent, DiscordPageProps } from "../types";
import {
  DiscordAuditPage,
  DiscordConnectionsPage,
  DiscordGuildSettingsPage,
  DiscordOverviewPage,
  DiscordTemplatesPage,
  DiscordUserLinkPage,
} from "../pages";
import { getDiscordAdminRoute, getSegment } from "./routes";

type DiscordAdminRouterProps = DiscordPageProps & {
  segments?: string[];
  LinkComponent?: DiscordLinkComponent;
};

export function DiscordAdminRouter({
  segments,
  api,
  organizationId,
  basePath = "/admin/discord",
  LinkComponent,
  className,
}: DiscordAdminRouterProps) {
  const segment = getSegment(segments);
  const guildId = segments?.[1] ?? "";
  const Link = LinkComponent ?? "a";

  return (
    <div className={className}>
      <Tabs value={segment} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={getDiscordAdminRoute(basePath, [])}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="connections" asChild>
            <Link href={getDiscordAdminRoute(basePath, ["connections"])}>
              Connections
            </Link>
          </TabsTrigger>
          <TabsTrigger value="templates" asChild>
            <Link href={getDiscordAdminRoute(basePath, ["templates"])}>
              Templates
            </Link>
          </TabsTrigger>
          <TabsTrigger value="audit" asChild>
            <Link href={getDiscordAdminRoute(basePath, ["audit"])}>Audit</Link>
          </TabsTrigger>
          <TabsTrigger value="link" asChild>
            <Link href={getDiscordAdminRoute(basePath, ["link"])}>Link</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {segment === "overview" ? (
        <DiscordOverviewPage
          api={api}
          organizationId={organizationId}
          basePath={basePath}
        />
      ) : null}
      {segment === "connections" ? (
        <DiscordConnectionsPage api={api} organizationId={organizationId} />
      ) : null}
      {segment === "templates" ? (
        <DiscordTemplatesPage
          api={api}
          organizationId={organizationId}
          basePath={basePath}
        />
      ) : null}
      {segment === "audit" ? (
        <DiscordAuditPage api={api} organizationId={organizationId} />
      ) : null}
      {segment === "link" ? (
        <DiscordUserLinkPage api={api} organizationId={organizationId} />
      ) : null}
      {segment === "guilds" && guildId ? (
        <DiscordGuildSettingsPage
          api={api}
          organizationId={organizationId}
          guildId={guildId}
        />
      ) : null}
    </div>
  );
}
