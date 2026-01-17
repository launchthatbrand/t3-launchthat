"use client";

import React from "react";
import { useAction, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordConnectionsPage({
  api,
  organizationId,
  className,
  ui,
}: DiscordPageProps) {
  const guildConnections = useQuery(
    api.queries.listGuildConnectionsForOrg,
    organizationId ? { organizationId } : {},
  );
  const startBotInstall = useAction(api.actions.startBotInstall);
  const disconnectGuild = useAction(api.actions.disconnectGuild);
  const [busyGuildId, setBusyGuildId] = React.useState<string | null>(null);

  const handleConnect = async () => {
    const returnTo = window.location.href;
    const result = await startBotInstall(
      organizationId ? { organizationId, returnTo } : { returnTo },
    );
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleDisconnect = async (guildId: string) => {
    setBusyGuildId(guildId);
    try {
      await disconnectGuild(
        organizationId ? { organizationId, guildId } : { guildId },
      );
    } finally {
      setBusyGuildId(null);
    }
  };

  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div
        className={cx(
          "mb-6 flex flex-wrap items-center justify-between gap-3",
          ui?.headerClassName,
        )}
      >
        <div>
          <h2
            className={cx(
              "text-foreground text-2xl font-semibold",
              ui?.titleClassName,
            )}
          >
            Discord connections
          </h2>
          <p
            className={cx(
              "text-muted-foreground text-sm",
              ui?.descriptionClassName,
            )}
          >
            Manage connected guilds and install the Discord bot.
          </p>
        </div>
        <Button onClick={handleConnect} className={ui?.buttonClassName}>
          Connect Discord
        </Button>
      </div>

      <div className="grid gap-4">
        {(guildConnections ?? []).map((guild: any) => (
          <Card key={guild.guildId} className={ui?.cardClassName}>
            <CardHeader
              className={cx(
                "flex flex-row items-center justify-between gap-3",
                ui?.cardHeaderClassName,
              )}
            >
              <CardTitle className={ui?.cardTitleClassName}>
                {guild.guildName ?? "Discord guild"}
              </CardTitle>
              <Badge variant="secondary" className={ui?.badgeClassName}>
                {guild.botModeAtConnect}
              </Badge>
            </CardHeader>
            <CardContent
              className={cx(
                "flex flex-wrap items-center justify-between gap-3",
                ui?.cardContentClassName,
              )}
            >
              <div className="text-muted-foreground text-sm">
                Guild ID:{" "}
                <span className="text-foreground font-mono">
                  {guild.guildId}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => handleDisconnect(guild.guildId)}
                disabled={busyGuildId === guild.guildId}
                className={ui?.outlineButtonClassName}
              >
                {busyGuildId === guild.guildId
                  ? "Disconnecting..."
                  : "Disconnect"}
              </Button>
            </CardContent>
          </Card>
        ))}

        {Array.isArray(guildConnections) && guildConnections.length === 0 ? (
          <Card className={ui?.cardClassName}>
            <CardContent
              className={cx(
                "text-muted-foreground py-10 text-center text-sm",
                ui?.cardContentClassName,
                ui?.emptyStateClassName,
              )}
            >
              No guilds connected yet. Click “Connect Discord” to install the
              bot.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
