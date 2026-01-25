"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui";

import { useTenant } from "~/context/TenantContext";

interface OrgRow {
  _id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  userRole: string;
  logoUrl: string | null;
}

interface StreamingStatusRow {
  organizationId: string;
  discordEnabled: boolean;
  hasGuild: boolean;
  guildId: string | null;
  guildName: string | null;
  inviteUrl: string | null;
  linkedDiscordUserId: string | null;
  linkedAt: number | null;
  streamingEnabled: boolean;
  streamingUpdatedAt: number | null;
}

const normalizeInviteUrl = (value: string | null): string | null => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  // Most discord invites can be stored as "discord.gg/xyz" or "https://discord.gg/xyz"
  return `https://${raw.replace(/^\/+/, "")}`;
};

const stripOauthParams = (url: string): string => {
  const u = new URL(url);
  u.searchParams.delete("state");
  u.searchParams.delete("code");
  u.searchParams.delete("error");
  u.searchParams.delete("error_description");
  u.searchParams.delete("guild_id");
  return u.toString();
};

export function DiscordUserSettingsClient() {
  const tenant = useTenant();
  const isOrgMode = Boolean(tenant && tenant.slug !== "platform");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const completeUserLink = useAction(api.discord.actions.completeUserLink);
  const startUserLink = useAction(api.discord.actions.startUserLink);
  const disconnectMyDiscordStreaming = useMutation(
    api.discord.mutations.disconnectMyDiscordStreaming,
  );
  const setMyDiscordStreamingEnabled = useMutation(
    api.discord.mutations.setMyDiscordStreamingEnabled,
  );

  const orgs = useQuery(api.coreTenant.organizations.myOrganizations, {}) as
    | OrgRow[]
    | undefined;

  const visibleOrgs = React.useMemo(() => {
    const rows = Array.isArray(orgs) ? orgs : [];
    if (!isOrgMode || !tenant?._id) return rows;
    return rows.filter((o) => o._id === tenant._id);
  }, [isOrgMode, orgs, tenant?._id]);

  const organizationIds = React.useMemo(
    () => visibleOrgs.map((o) => o._id).filter(Boolean),
    [visibleOrgs],
  );

  const streamingStatuses = useQuery(
    api.discord.queries.getMyDiscordStreamingOrgs,
    organizationIds.length > 0 ? { organizationIds } : "skip",
  ) as StreamingStatusRow[] | undefined;

  const statusByOrgId = React.useMemo(() => {
    const map = new Map<string, StreamingStatusRow>();
    for (const row of streamingStatuses ?? []) {
      map.set(row.organizationId, row);
    }
    return map;
  }, [streamingStatuses]);

  const [linkBusyForOrg, setLinkBusyForOrg] = React.useState<string | null>(
    null,
  );
  const [disconnectBusyForOrg, setDisconnectBusyForOrg] = React.useState<
    string | null
  >(null);
  const [toggleBusyForOrg, setToggleBusyForOrg] = React.useState<string | null>(
    null,
  );

  const handledLinkRef = React.useRef<string | null>(null);

  const oauthState = (searchParams.get("state") ?? "").trim();
  const oauthCode = (searchParams.get("code") ?? "").trim();
  const oauthError = (searchParams.get("error") ?? "").trim();
  const oauthErrorDescription = (
    searchParams.get("error_description") ?? ""
  ).trim();

  React.useEffect(() => {
    if (!oauthState) return;

    // Always clear the URL after we handle it.
    const clearUrl = () => router.replace(pathname);

    if (oauthError) {
      toast.error(
        oauthErrorDescription
          ? `Discord connect failed: ${oauthErrorDescription}`
          : `Discord connect failed: ${oauthError}`,
      );
      clearUrl();
      return;
    }

    if (!oauthCode) return;

    const handledKey = `${oauthState}::${oauthCode}`;
    if (handledLinkRef.current === handledKey) return;
    handledLinkRef.current = handledKey;

    void (async () => {
      try {
        await completeUserLink({ state: oauthState, code: oauthCode });
        toast.success("Discord connected.");
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to complete Discord connect.",
        );
      } finally {
        clearUrl();
      }
    })();
  }, [
    completeUserLink,
    oauthCode,
    oauthError,
    oauthErrorDescription,
    oauthState,
    pathname,
    router,
  ]);

  const handleConnect = async (organizationId: string) => {
    if (typeof window === "undefined") return;
    setLinkBusyForOrg(organizationId);
    try {
      const returnTo = stripOauthParams(window.location.href);
      const result = (await startUserLink({ organizationId, returnTo })) as {
        url: string;
        state: string;
      };
      window.location.assign(result.url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start Discord connect.",
      );
      setLinkBusyForOrg(null);
    }
  };

  const handleDisconnect = async (organizationId: string) => {
    setDisconnectBusyForOrg(organizationId);
    try {
      await disconnectMyDiscordStreaming({ organizationId });
      toast.success("Disconnected.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect.",
      );
    } finally {
      setDisconnectBusyForOrg(null);
    }
  };

  const handleToggleStreaming = async (
    organizationId: string,
    enabled: boolean,
  ) => {
    setToggleBusyForOrg(organizationId);
    try {
      await setMyDiscordStreamingEnabled({ organizationId, enabled });
      toast.success(enabled ? "Streaming enabled." : "Streaming disabled.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update streaming.",
      );
    } finally {
      setToggleBusyForOrg(null);
    }
  };

  if (!orgs) {
    return (
      <div className="space-y-4">
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Discord</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (visibleOrgs.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Discord</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You’re not a member of any organizations yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Discord</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Connect your Discord identity per organization to enable streaming and
          @mentions. You must be a member of the org’s Discord server.
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visibleOrgs.map((org) => {
          const status = statusByOrgId.get(org._id);
          const inviteUrl = normalizeInviteUrl(status?.inviteUrl ?? null);
          const canConnect = Boolean(status && status.discordEnabled && status.hasGuild);
          const isLinked = Boolean(status?.linkedDiscordUserId);
          const isBusy =
            linkBusyForOrg === org._id ||
            disconnectBusyForOrg === org._id ||
            toggleBusyForOrg === org._id;

          return (
            <Card
              key={org._id}
              className="border-border/60 bg-card/70 backdrop-blur"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-semibold">
                        {org.name}
                      </div>
                      <Badge variant="secondary" className="border-border/40">
                        {org.userRole}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {org.customDomain ?? `${org.slug}.traderlaunchpad.com`}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge
                      className={
                        status?.discordEnabled
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                          : "bg-red-500/10 text-red-500 border border-red-500/30"
                      }
                    >
                      {status?.discordEnabled ? "Discord enabled" : "Not enabled"}
                    </Badge>
                    <Badge
                      className={
                        status?.hasGuild
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                      }
                    >
                      {status?.hasGuild
                        ? `Guild connected: ${status.guildName ?? status.guildId ?? "Unknown"}`
                        : "No guild connected"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Streaming</div>
                    <Switch
                      checked={Boolean(status?.streamingEnabled)}
                      disabled={!isLinked || isBusy}
                      onCheckedChange={(checked) =>
                        void handleToggleStreaming(org._id, checked)
                      }
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isLinked
                      ? status?.streamingEnabled
                        ? "Enabled"
                        : "Disabled"
                      : "Connect Discord to enable streaming."}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isLinked ? (
                    <Button
                      disabled={!canConnect || isBusy}
                      onClick={() => void handleConnect(org._id)}
                    >
                      {canConnect ? "Connect" : "Unavailable"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => void handleDisconnect(org._id)}
                    >
                      Disconnect
                    </Button>
                  )}

                  {inviteUrl ? (
                    <Button
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => window.open(inviteUrl, "_blank")}
                    >
                      Join org Discord
                    </Button>
                  ) : null}
                </div>

                {!canConnect ? (
                  <div className="rounded-lg border border-border/60 bg-black/20 p-3 text-xs text-muted-foreground">
                    Ask an org admin to enable Discord and connect a guild on{" "}
                    <span className="font-medium">Admin → Connections → Discord</span>.
                  </div>
                ) : null}

                <div className="text-xs text-muted-foreground">
                  {status?.linkedDiscordUserId ? (
                    <>
                      Linked as <span className="font-mono">{status.linkedDiscordUserId}</span>
                    </>
                  ) : (
                    "Not linked yet."
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

