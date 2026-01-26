"use client";

import React from "react";

import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type {
  DiscordLinkComponent,
  DiscordChannelField,
  DiscordPageProps,
  DiscordTemplateContext,
} from "../types";
import {
  DiscordAuditPage,
  DiscordChannelsPage,
  DiscordConnectionsPage,
  DiscordGuildAutomationPage,
  DiscordGuildAutomationsPage,
  DiscordGuildOverviewPage,
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
  channelFields?: DiscordChannelField[];
};

export function DiscordAdminRouter({
  segments,
  api,
  organizationId,
  basePath = "/admin/discord",
  LinkComponent,
  templateContexts,
  defaultTemplateKind,
  channelFields,
  ui,
  className,
}: DiscordAdminRouterProps) {
  const isFocusedGuild = segments?.[0] === "guilds" && Boolean(segments?.[1]);
  const focusedGuildId = isFocusedGuild ? (segments?.[1] ?? "") : "";
  const segment =
    isFocusedGuild ? (segments?.[2] ?? "overview") : (segments?.[0] ?? "overview");

  const scopedBasePath = isFocusedGuild
    ? getDiscordAdminRoute(basePath, ["guilds", focusedGuildId])
    : basePath;
  const Link = LinkComponent ?? "a";
  const focusedAutomationId = isFocusedGuild ? (segments?.[3] ?? "") : "";

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
          {isFocusedGuild ? (
            <TabsTrigger value="automations" asChild>
              <Link href={getDiscordAdminRoute(scopedBasePath, ["automations"])}>
                Automations
              </Link>
            </TabsTrigger>
          ) : null}
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
          <DiscordGuildOverviewPage
            api={api}
            organizationId={organizationId}
            guildId={focusedGuildId}
            basePath={scopedBasePath}
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
      {segment === "automations" || (segment === "channels" && isFocusedGuild) ? (
        isFocusedGuild && focusedGuildId ? (
          focusedAutomationId ? (
            <DiscordGuildAutomationPage
              api={api}
              organizationId={organizationId}
              guildId={focusedGuildId}
              basePath={scopedBasePath}
              automationId={focusedAutomationId}
              ui={ui}
            />
          ) : (
            <DiscordGuildAutomationsPage
              api={api}
              organizationId={organizationId}
              guildId={focusedGuildId}
              basePath={scopedBasePath}
              ui={ui}
            />
          )
        ) : (
          <DiscordChannelsPage api={api} organizationId={organizationId} ui={ui} />
        )
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
