"use client";

import React from "react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type {
  DiscordLinkComponent,
  DiscordPageProps,
  DiscordTemplateContext,
} from "../types";
import {
  DiscordAuditPage,
  DiscordChannelsPage,
  DiscordConnectionsPage,
  DiscordGuildSettingsPage,
  DiscordOverviewPage,
  DiscordTemplatesPage,
  DiscordUserLinkPage,
} from "../pages";
import { getDiscordAdminRoute } from "./routes";

type DiscordAdminRouterProps = DiscordPageProps & {
  segments?: string[];
  LinkComponent?: DiscordLinkComponent;
  templateContexts?: DiscordTemplateContext[];
  defaultTemplateKind?: string;
};

export function DiscordAdminRouter({
  segments,
  api,
  organizationId,
  basePath = "/admin/discord",
  LinkComponent,
  templateContexts,
  defaultTemplateKind,
  ui,
  className,
}: DiscordAdminRouterProps) {
  const isFocusedGuild = segments?.[0] === "guilds" && Boolean(segments?.[1]);
  const focusedGuildId = isFocusedGuild ? (segments?.[1] ?? "") : "";
  const segment = isFocusedGuild ? (segments?.[2] ?? "overview") : (segments?.[0] ?? "overview");

  const scopedBasePath = isFocusedGuild
    ? getDiscordAdminRoute(basePath, ["guilds", focusedGuildId])
    : basePath;
  const Link = LinkComponent ?? "a";

  return (
    <div className={className}>
      <Tabs value={segment} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={getDiscordAdminRoute(scopedBasePath, [])}>Overview</Link>
          </TabsTrigger>
          {!isFocusedGuild ? (
            <TabsTrigger value="connections" asChild>
              <Link href={getDiscordAdminRoute(scopedBasePath, ["connections"])}>
                Connections
              </Link>
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="templates" asChild>
            <Link href={getDiscordAdminRoute(scopedBasePath, ["templates"])}>
              Templates
            </Link>
          </TabsTrigger>
          <TabsTrigger value="channels" asChild>
            <Link href={getDiscordAdminRoute(scopedBasePath, ["channels"])}>
              Channels
            </Link>
          </TabsTrigger>
          <TabsTrigger value="audit" asChild>
            <Link href={getDiscordAdminRoute(scopedBasePath, ["audit"])}>Audit</Link>
          </TabsTrigger>
          <TabsTrigger value="link" asChild>
            <Link href={getDiscordAdminRoute(scopedBasePath, ["link"])}>Link</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {segment === "overview" ? (
        isFocusedGuild && focusedGuildId ? (
          <DiscordGuildSettingsPage
            api={api}
            organizationId={organizationId}
            guildId={focusedGuildId}
            ui={ui}
          />
        ) : (
          <DiscordOverviewPage
            api={api}
            organizationId={organizationId}
            basePath={scopedBasePath}
            ui={ui}
          />
        )
      ) : null}
      {segment === "connections" && !isFocusedGuild ? (
        <DiscordConnectionsPage
          api={api}
          organizationId={organizationId}
          ui={ui}
        />
      ) : null}
      {segment === "templates" ? (
        <DiscordTemplatesPage
          api={api}
          organizationId={organizationId}
          basePath={scopedBasePath}
          guildId={isFocusedGuild ? focusedGuildId : undefined}
          templateContexts={templateContexts}
          defaultTemplateKind={defaultTemplateKind}
          ui={ui}
        />
      ) : null}
      {segment === "channels" ? (
        <DiscordChannelsPage api={api} organizationId={organizationId} ui={ui} />
      ) : null}
      {segment === "audit" ? (
        <DiscordAuditPage api={api} organizationId={organizationId} ui={ui} />
      ) : null}
      {segment === "link" ? (
        <DiscordUserLinkPage
          api={api}
          organizationId={organizationId}
          ui={ui}
        />
      ) : null}
    </div>
  );
}
