"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";

import type { DiscordPageProps } from "../types";
import { getDiscordAdminRoute } from "../router/routes";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordOverviewPage({
  api,
  organizationId,
  basePath = "/admin/discord",
  className,
  ui,
}: DiscordPageProps) {
  const orgConfig = useQuery(
    api.queries.getOrgConfig,
    organizationId ? { organizationId } : {},
  );
  const setOrgDiscordEnabled = useMutation(api.mutations.setOrgEnabled);
  const guildConnections = useQuery(
    api.queries.listGuildConnectionsForOrg,
    organizationId ? { organizationId } : {},
  );

  const enabled = orgConfig?.enabled ?? false;
  const botMode = orgConfig?.botMode ?? "global";
  const [settingEnabled, setSettingEnabled] = React.useState(false);
  const guildCount = Array.isArray(guildConnections)
    ? guildConnections.length
    : 0;

  const badgeClassName = enabled
    ? cx(ui?.badgeClassName, ui?.badgePositiveClassName)
    : cx(ui?.badgeClassName, ui?.badgeNegativeClassName);

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
            Discord overview
          </h2>
          <p
            className={cx(
              "text-muted-foreground text-sm",
              ui?.descriptionClassName,
            )}
          >
            Monitor Discord connectivity, routing, and account linkage.
          </p>
        </div>
        <Button asChild className={ui?.buttonClassName}>
          <a href={getDiscordAdminRoute(basePath, ["connections"])}>
            Manage connections
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={ui?.cardClassName}>
          <CardHeader className={ui?.cardHeaderClassName}>
            <CardTitle className={ui?.cardTitleClassName}>Status</CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-2", ui?.cardContentClassName)}>
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={badgeClassName}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
            <div className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground text-sm">
                Allow org Discord actions
              </div>
              <Switch
                checked={enabled}
                disabled={settingEnabled}
                onCheckedChange={(checked) => {
                  setSettingEnabled(true);
                  void setOrgDiscordEnabled(
                    organizationId ? { organizationId, enabled: checked } : { enabled: checked },
                  ).finally(() => setSettingEnabled(false));
                }}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Bot mode:{" "}
              <span className="text-foreground font-medium">{botMode}</span>
            </p>
          </CardContent>
        </Card>
        <Card className={ui?.cardClassName}>
          <CardHeader className={ui?.cardHeaderClassName}>
            <CardTitle className={ui?.cardTitleClassName}>
              Connected guilds
            </CardTitle>
          </CardHeader>
          <CardContent className={cx("space-y-2", ui?.cardContentClassName)}>
            <p className="text-3xl font-semibold">{guildCount}</p>
            <p className="text-muted-foreground text-sm">
              Active Discord servers connected.
            </p>
          </CardContent>
        </Card>
        <Card className={ui?.cardClassName}>
          <CardHeader className={ui?.cardHeaderClassName}>
            <CardTitle className={ui?.cardTitleClassName}>Next steps</CardTitle>
          </CardHeader>
          <CardContent
            className={cx(
              "text-muted-foreground space-y-3 text-sm",
              ui?.cardContentClassName,
            )}
          >
            <p>
              Connect a guild, set trade feed channels, and customize templates.
            </p>
            <Button
              variant="outline"
              asChild
              className={ui?.outlineButtonClassName}
            >
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
