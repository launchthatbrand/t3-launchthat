"use client";

import React from "react";
import { useAction } from "convex/react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import { api } from "@convex-config/_generated/api";

interface GuildConnectionRow {
  guildId: string;
  guildName?: string;
  botModeAtConnect: "global" | "custom";
  connectedAt: number;
}

export default function AdminOrganizationConnectionsPage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const completeBotInstall = useAction(api.discord.actions.completeBotInstall);
  const startBotInstall = useAction(api.discord.actions.startBotInstall);
  const disconnectGuild = useAction(api.discord.actions.disconnectGuild);
  const handledInstallRef = React.useRef<string | null>(null);
  const [busyGuildId, setBusyGuildId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const guildId = searchParams.get("guild_id");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      toast.error(
        errorDescription
          ? `Discord connect failed: ${errorDescription}`
          : `Discord connect failed: ${error}`,
      );
      router.replace(pathname);
      return;
    }
    if (!guildId || !state) return;

    const key = `${state}::${guildId}`;
    if (handledInstallRef.current === key) return;
    handledInstallRef.current = key;

    void (async () => {
      try {
        await completeBotInstall({ state, guildId });
        toast.success("Discord connected.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to connect Discord.");
      } finally {
        router.replace(pathname);
      }
    })();
  }, [completeBotInstall, pathname, router, searchParams]);

  const guildConnections = useQuery(
    api.discord.queries.listGuildConnectionsForOrg,
    organizationId ? { organizationId } : "skip",
  ) as GuildConnectionRow[] | undefined;

  const ui = React.useMemo(
    () => ({
      cardClassName:
        "border border-border/60 bg-card/70 backdrop-blur border-l-4 border-l-emerald-500/50",
      cardHeaderClassName: "pb-2",
      badgeClassName: "border border-border/40",
      badgePositiveClassName:
        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30",
      badgeNegativeClassName:
        "bg-red-500/10 text-red-500 border border-red-500/30",
      outlineButtonClassName: "border-border/60",
    }),
    [],
  );

  const handleConnect = async () => {
    if (typeof window === "undefined") return;
    if (!organizationId) return;
    const returnTo = window.location.href;
    const result = (await startBotInstall({ organizationId, returnTo })) as {
      url: string;
      state: string;
    };
    if (result.url) window.location.assign(result.url);
  };

  const handleDisconnect = async (guildId: string) => {
    if (!organizationId) return;
    setBusyGuildId(guildId);
    try {
      await disconnectGuild({ organizationId, guildId });
      toast.success("Discord disconnected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect Discord.");
    } finally {
      setBusyGuildId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Configure organization-level integrations like Discord.
        </CardContent>
      </Card>

      <Card className={ui.cardClassName}>
        <CardHeader className={ui.cardHeaderClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Discord</CardTitle>
            <Button disabled={!organizationId} onClick={() => void handleConnect()}>
              Connect Discord
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {(guildConnections ?? []).map((guild) => (
              <Card key={guild.guildId} className={ui.cardClassName}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {guild.guildName ?? "Discord guild"}
                  </CardTitle>
                  <Badge variant="secondary" className={ui.badgeClassName}>
                    {guild.botModeAtConnect}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-muted-foreground text-sm">
                    Guild ID:{" "}
                    <span className="text-foreground font-mono">
                      {guild.guildId}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className={ui.outlineButtonClassName}>
                      <Link
                        href={`/admin/organization/${encodeURIComponent(
                          organizationId,
                        )}/connections/discord/guilds/${encodeURIComponent(guild.guildId)}`}
                      >
                        Manage
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className={ui.outlineButtonClassName}
                      disabled={busyGuildId === guild.guildId}
                      onClick={() => void handleDisconnect(guild.guildId)}
                    >
                      {busyGuildId === guild.guildId ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Array.isArray(guildConnections) && guildConnections.length === 0 ? (
              <Card className={ui.cardClassName}>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  No guilds connected yet. Click “Connect Discord” to install the bot.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

