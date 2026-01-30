"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import React from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";

import { api } from "@convex-config/_generated/api";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui";
import { useDiscordOAuthCallback } from "~/components/discord/useDiscordOAuthCallback";

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
  linkedUsername: string | null;
  linkedDiscriminator: string | null;
  linkedGlobalName: string | null;
  linkedAvatar: string | null;
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

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const platformDiscordApi = (api as any).platformDiscord;
  const completeUserLink = useAction(api.discord.actions.completeUserLink);
  const startUserLink = useAction(api.discord.actions.startUserLink);
  const completePlatformUserLink = useAction(platformDiscordApi.actions.completeUserLink);
  const startPlatformUserLink = useAction(platformDiscordApi.actions.startUserLink);
  const disconnectMyDiscordStreaming = useMutation(
    api.discord.mutations.disconnectMyDiscordStreaming,
  );
  const unlinkMyDiscordLink = useMutation(api.discord.mutations.unlinkMyDiscordLink);
  const disconnectPlatformDiscord = useMutation(
    platformDiscordApi.mutations.disconnectMyDiscordStreaming,
  );
  const setMyDiscordStreamingEnabled = useMutation(
    api.discord.mutations.setMyDiscordStreamingEnabled,
  );
  const setPlatformDiscordStreamingEnabled = useMutation(
    platformDiscordApi.mutations.setMyDiscordStreamingEnabled,
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

  const platformLink = useQuery(
    platformDiscordApi.queries.getMyDiscordUserLink,
    {},
  ) as
    | {
        linkedDiscordUserId: string | null;
        linkedAt: number | null;
        inviteUrl: string | null;
        guildId: string | null;
        profile:
          | {
              username: string | null;
              discriminator: string | null;
              globalName: string | null;
              avatar: string | null;
            }
          | null;
        streamingEnabled: boolean | null;
        streamingUpdatedAt: number | null;
      }
    | undefined;

  const statusByOrgId = React.useMemo(() => {
    const map = new Map<string, StreamingStatusRow>();
    for (const row of streamingStatuses ?? []) {
      map.set(row.organizationId, row);
    }
    return map;
  }, [streamingStatuses]);

  const orgProfile = React.useMemo(() => {
    const rows = Array.isArray(streamingStatuses) ? streamingStatuses : [];
    const first = rows.find(
      (row) =>
        row.linkedDiscordUserId &&
        (row.linkedUsername ??
          row.linkedGlobalName ??
          row.linkedDiscriminator ??
          row.linkedAvatar),
    );
    if (!first) return null;
    return {
      linkedDiscordUserId: first.linkedDiscordUserId,
      profile: {
        username: first.linkedUsername ?? null,
        discriminator: first.linkedDiscriminator ?? null,
        globalName: first.linkedGlobalName ?? null,
        avatar: first.linkedAvatar ?? null,
      },
    };
  }, [streamingStatuses]);

  const profile = platformLink?.profile ?? orgProfile?.profile ?? null;
  const profileUserId =
    platformLink?.linkedDiscordUserId ?? orgProfile?.linkedDiscordUserId ?? null;
  const profileAvatarUrl =
    profileUserId && profile?.avatar
      ? `https://cdn.discordapp.com/avatars/${profileUserId}/${profile.avatar}.png?size=128`
      : null;
  const profileDisplayName =
    profile?.globalName ??
    profile?.username ??
    (profileUserId ? `Discord ${profileUserId}` : null);
  const profileHandle =
    profile?.username != null
      ? `${profile.username}${profile.discriminator ? `#${profile.discriminator}` : ""}`
      : null;

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
  const unauthNotifiedRef = React.useRef(false);

  useDiscordOAuthCallback({
    scope: "any",
    onCompletePlatform: ({ state, code }) =>
      completePlatformUserLink({ state, code }),
    onCompleteOrg: ({ state, code }) => {
      return completeUserLink({ state, code }).then(() => undefined);
    },
    onAuthRequired: () => {
      if (!unauthNotifiedRef.current) {
        toast.error("Please sign in to finish connecting Discord.");
        unauthNotifiedRef.current = true;
      }
    },
    onSuccess: () => {
      unauthNotifiedRef.current = false;
      toast.success("Discord connected.");
    },
    onError: (message) => {
      toast.error(message || "Failed to complete Discord connect.");
    },
  });

  const buildReturnTo = (scope: "platform" | "org") => {
    const base = stripOauthParams(window.location.href);
    const url = new URL(base);
    url.searchParams.set("discordScope", scope);
    return url.toString();
  };

  const handleConnectOrg = async (organizationId?: string | null) => {
    if (typeof window === "undefined") return;
    setLinkBusyForOrg(organizationId ?? "user");
    try {
      const returnTo = buildReturnTo("org");
      const result = (await startUserLink({
        organizationId: organizationId ?? undefined,
        returnTo,
      })) as {
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

  const handleConnectPlatform = async () => {
    if (typeof window === "undefined") return;
    setLinkBusyForOrg("platform");
    try {
      const returnTo = buildReturnTo("platform");
      const result = (await startPlatformUserLink({
        returnTo,
      })) as {
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

  const handleDisconnect = async (organizationId?: string | null) => {
    const key = organizationId ?? "user";
    setDisconnectBusyForOrg(key);
    try {
      if (organizationId) {
        await disconnectMyDiscordStreaming({ organizationId });
      } else {
        await unlinkMyDiscordLink({});
      }
      toast.success("Disconnected.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to disconnect.",
      );
    } finally {
      setDisconnectBusyForOrg(null);
    }
  };

  const handleDisconnectPlatform = async () => {
    setDisconnectBusyForOrg("platform");
    try {
      await disconnectPlatformDiscord({});
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

  const handleTogglePlatformStreaming = async (enabled: boolean) => {
    setToggleBusyForOrg("platform");
    try {
      await setPlatformDiscordStreamingEnabled({ enabled });
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

  const platformIsLinked = Boolean(platformLink?.linkedDiscordUserId);
  const platformInviteUrl = normalizeInviteUrl(platformLink?.inviteUrl ?? null);
  const platformStreamingEnabled = Boolean(platformLink?.streamingEnabled);
  const platformBusy =
    linkBusyForOrg === "platform" ||
    disconnectBusyForOrg === "platform" ||
    toggleBusyForOrg === "platform";

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Discord profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted/40">
            {profileAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground">N/A</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">
              {profileDisplayName ?? "Discord not linked yet"}
            </div>
            {profileHandle ? (
              <div className="text-xs text-muted-foreground">{profileHandle}</div>
            ) : null}
            {profileUserId ? (
              <div className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{profileUserId}</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Connect any Discord server below to populate your profile.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-base font-semibold">
                  TraderLaunchpad Discord
                </div>
                <Badge variant="secondary" className="border-border/40">
                  Platform
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Manage your platform Discord link and streaming preferences.
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Streaming</div>
              <Switch
                checked={platformStreamingEnabled}
                disabled={!platformIsLinked || platformBusy}
                onCheckedChange={(checked) => void handleTogglePlatformStreaming(checked)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {platformIsLinked
                ? platformStreamingEnabled
                  ? "Enabled"
                  : "Disabled"
                : "Connect Discord to enable streaming."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!platformIsLinked ? (
              <Button disabled={platformBusy} onClick={() => void handleConnectPlatform()}>
                Link Discord
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={platformBusy}
                onClick={() => void handleDisconnectPlatform()}
              >
                Disconnect
              </Button>
            )}
            {platformInviteUrl ? (
              <Button
                variant="outline"
                disabled={platformBusy}
                onClick={() => window.open(platformInviteUrl, "_blank")}
              >
                Join server
              </Button>
            ) : null}
          </div>

          <div className="text-xs text-muted-foreground">
            {platformIsLinked ? (
              <>
                Linked as{" "}
                <span className="font-mono">
                  {platformLink?.linkedDiscordUserId ?? "Unknown"}
                </span>
              </>
            ) : (
              "Not linked yet."
            )}
          </div>
        </CardContent>
      </Card>

      {visibleOrgs.length > 0 ? (
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Organization Discord</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect your Discord identity per organization to enable streaming and
            @mentions. You must be a member of the org’s Discord server.
          </CardContent>
        </Card>
      ) : null}

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
                        Organization
                      </Badge>
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
                      onClick={() => void handleConnectOrg(org._id)}
                    >
                      {canConnect ? "Link Discord" : "Unavailable"}
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
                      Join server
                    </Button>
                  ) : null}
                </div>

                {!canConnect ? (
                  <div className="rounded-lg border border-border/60 bg-black/20 p-3 text-xs text-muted-foreground">
                    Ask an org admin to enable Discord and connect a guild under{" "}
                    <span className="font-medium">Connections → Discord</span>.
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

