"use client";

import React from "react";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordGuildOverviewPage(props: DiscordPageProps & { guildId: string }) {
  const guildConnections = useQuery(
    props.api.queries.listGuildConnectionsForOrg,
    props.organizationId ? { organizationId: props.organizationId } : {},
  );
  const guild = Array.isArray(guildConnections)
    ? guildConnections.find((row: any) => String(row?.guildId ?? "") === props.guildId)
    : null;

  const settings = useQuery(props.api.queries.getGuildSettings, {
    ...(props.organizationId ? { organizationId: props.organizationId } : {}),
    guildId: props.guildId,
  });

  const mappedChannelsCount = React.useMemo(() => {
    if (!settings) return 0;
    const keys: string[] = [
      "announcementChannelId",
      "mentorTradesChannelId",
      "memberTradesChannelId",
      "supportForumChannelId",
      "supportPrivateIntakeChannelId",
      "courseUpdatesChannelId",
    ];
    return keys.reduce((acc, key) => {
      const value = (settings as any)?.[key];
      return acc + (typeof value === "string" && value.trim() ? 1 : 0);
    }, 0);
  }, [settings]);

  const badgeClassName = cx(
    props.ui?.badgeClassName,
    props.ui?.badgePositiveClassName,
  );

  return (
    <div className={cx(props.className, props.ui?.pageClassName)}>
      <div className={cx("mb-6 space-y-2", props.ui?.headerClassName)}>
        <h2 className={cx("text-foreground text-2xl font-semibold", props.ui?.titleClassName)}>
          {guild?.guildName ? `Discord — ${guild.guildName}` : "Discord guild"}
        </h2>
        <p className={cx("text-muted-foreground text-sm", props.ui?.descriptionClassName)}>
          Overview for this specific Discord server connection.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={props.ui?.cardClassName}>
          <CardHeader className={props.ui?.cardHeaderClassName}>
            <CardTitle className={props.ui?.cardTitleClassName}>Status</CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-2", props.ui?.cardContentClassName)}>
            <Badge className={badgeClassName}>Connected</Badge>
            <div className="text-muted-foreground text-sm">
              Guild ID: <span className="text-foreground font-mono">{props.guildId}</span>
            </div>
            <div className="text-muted-foreground text-sm">
              Bot mode:{" "}
              <span className="text-foreground font-medium">
                {guild?.botModeAtConnect ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={props.ui?.cardClassName}>
          <CardHeader className={props.ui?.cardHeaderClassName}>
            <CardTitle className={props.ui?.cardTitleClassName}>Members</CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-2", props.ui?.cardContentClassName)}>
            <p className="text-3xl font-semibold">—</p>
            <p className="text-muted-foreground text-sm">
              Member count requires a guild sync/API call (app-layer action).
            </p>
          </CardContent>
        </Card>

        <Card className={props.ui?.cardClassName}>
          <CardHeader className={props.ui?.cardHeaderClassName}>
            <CardTitle className={props.ui?.cardTitleClassName}>Configured</CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-2", props.ui?.cardContentClassName)}>
            <p className="text-3xl font-semibold">{mappedChannelsCount}</p>
            <p className="text-muted-foreground text-sm">Channel mappings set for this guild.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className={props.ui?.cardClassName}>
          <CardHeader className={props.ui?.cardHeaderClassName}>
            <CardTitle className={props.ui?.cardTitleClassName}>Support AI</CardTitle>
          </CardHeader>
          <CardContent className={cx("text-muted-foreground text-sm", props.ui?.cardContentClassName)}>
            {settings?.supportAiEnabled ? "Enabled" : "Disabled"}
          </CardContent>
        </Card>
        <Card className={props.ui?.cardClassName}>
          <CardHeader className={props.ui?.cardHeaderClassName}>
            <CardTitle className={props.ui?.cardTitleClassName}>Invite link</CardTitle>
          </CardHeader>
          <CardContent className={cx("text-muted-foreground text-sm", props.ui?.cardContentClassName)}>
            {typeof (settings as any)?.inviteUrl === "string" && (settings as any).inviteUrl.trim()
              ? (settings as any).inviteUrl
              : "Not set"}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

