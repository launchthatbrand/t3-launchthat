"use client";
/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/array-type
*/

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { toast } from "sonner";

import { Settings, Unplug } from "lucide-react";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list";
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";

type DiscordRole = {
  id: string;
  name: string;
  managed?: boolean;
};

type DiscordGuildChannel = {
  id: string;
  name: string;
  type: number;
  parentId?: string;
};

type GuildConnection = {
  guildId: string;
  guildName?: string;
  botModeAtConnect?: "global" | "custom";
  connectedAt?: number;
};

export const DiscordServerConfigPage = (props: { organizationId?: string | null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = props.organizationId ?? null;

  const discordQueries = (api as any).plugins.discord.queries;
  const discordActions = (api as any).plugins.discord.actions;

  const useQueryAny = useQuery as unknown as (func: any, args: any) => any;

  const guildId = (searchParams.get("guildId") ?? "").trim();

  const guildConnections = useQueryAny(
    discordQueries.listGuildConnectionsForOrg,
    organizationId ? { organizationId: String(organizationId) } : "skip",
  ) as GuildConnection[] | undefined;

  const disconnectGuild = useAction(discordActions.disconnectGuild);
  const listRolesForGuild = useAction(discordActions.listRolesForGuild);
  const listGuildChannels = useAction(discordActions.listGuildChannels);
  const createRole = useAction(discordActions.createRole);
  const updateRole = useAction(discordActions.updateRole);
  const deleteRole = useAction(discordActions.deleteRole);
  const upsertGuildSettings = useAction(discordActions.upsertGuildSettings);

  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);
  const [roles, setRoles] = React.useState<Array<DiscordRole>>([]);
  const [newRoleName, setNewRoleName] = React.useState("");
  const [pendingDeleteRoleId, setPendingDeleteRoleId] = React.useState<
    string | null
  >(null);
  const [pendingRenameRoleId, setPendingRenameRoleId] = React.useState<
    string | null
  >(null);
  const [renameRoleNameDraft, setRenameRoleNameDraft] = React.useState("");
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = React.useState(false);
  const [pendingDisconnectGuildId, setPendingDisconnectGuildId] = React.useState<
    string | null
  >(null);

  const [isLoadingChannels, setIsLoadingChannels] = React.useState(false);
  const [channels, setChannels] = React.useState<Array<DiscordGuildChannel>>([]);

  const guildSettings = useQueryAny(
    discordQueries.getGuildSettings,
    organizationId && guildId
      ? { organizationId: String(organizationId), guildId }
      : "skip",
  ) as any;

  const [supportAiEnabledDraft, setSupportAiEnabledDraft] = React.useState(false);
  const [supportForumChannelIdDraft, setSupportForumChannelIdDraft] =
    React.useState<string | null>(null);
  const [supportStaffRoleIdDraft, setSupportStaffRoleIdDraft] =
    React.useState<string | null>(null);
  const [escalationKeywordsDraft, setEscalationKeywordsDraft] = React.useState("");
  const [confidenceThresholdDraft, setConfidenceThresholdDraft] = React.useState("0.65");
  const [threadReplyCooldownMsDraft, setThreadReplyCooldownMsDraft] =
    React.useState("15000");
  const [courseUpdatesChannelIdDraft, setCourseUpdatesChannelIdDraft] =
    React.useState<string | null>(null);

  const activeGuild = React.useMemo(() => {
    if (!guildId) return null;
    return (guildConnections ?? []).find((g) => g.guildId === guildId) ?? null;
  }, [guildConnections, guildId]);

  const handleSelectGuild = async (id: string) => {
    router.push(`/admin/edit?plugin=discord&page=serverconfig&guildId=${encodeURIComponent(id)}`);
  };

  const handleDisconnect = async (id: string) => {
    if (!organizationId) return;
    try {
      await disconnectGuild({ organizationId: String(organizationId), guildId: id });
      toast.success("Disconnected server");
      router.push("/admin/edit?plugin=discord&page=settings");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to disconnect");
    }
  };

  const loadRoles = async (id: string) => {
    if (!organizationId) return;
    try {
      setIsLoadingRoles(true);
      const fetched = (await listRolesForGuild({
        organizationId: String(organizationId),
        guildId: id,
      })) as Array<DiscordRole>;
      setRoles(fetched);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to load roles");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  React.useEffect(() => {
    if (!guildId) return;
    void loadRoles(guildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, organizationId]);

  const loadChannels = async (id: string) => {
    if (!organizationId) return;
    try {
      setIsLoadingChannels(true);
      const fetched = (await listGuildChannels({
        organizationId: String(organizationId),
        guildId: id,
      })) as Array<DiscordGuildChannel>;
      setChannels(fetched);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to load channels");
    } finally {
      setIsLoadingChannels(false);
    }
  };

  React.useEffect(() => {
    if (!guildId) return;
    void loadChannels(guildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, organizationId]);

  React.useEffect(() => {
    if (!guildId) return;
    if (!guildSettings) return;

    setSupportAiEnabledDraft(Boolean(guildSettings.supportAiEnabled));
    setSupportForumChannelIdDraft(
      typeof guildSettings.supportForumChannelId === "string"
        ? guildSettings.supportForumChannelId
        : null,
    );
    setSupportStaffRoleIdDraft(
      typeof guildSettings.supportStaffRoleId === "string"
        ? guildSettings.supportStaffRoleId
        : null,
    );
    setCourseUpdatesChannelIdDraft(
      typeof guildSettings.courseUpdatesChannelId === "string"
        ? guildSettings.courseUpdatesChannelId
        : null,
    );

    const kws = Array.isArray(guildSettings.escalationKeywords)
      ? (guildSettings.escalationKeywords as unknown[])
          .filter((v) => typeof v === "string")
          .join(", ")
      : "";
    setEscalationKeywordsDraft(kws);

    const threshold =
      typeof guildSettings.escalationConfidenceThreshold === "number"
        ? String(guildSettings.escalationConfidenceThreshold)
        : "0.65";
    setConfidenceThresholdDraft(threshold);

    const cooldown =
      typeof guildSettings.threadReplyCooldownMs === "number"
        ? String(guildSettings.threadReplyCooldownMs)
        : "15000";
    setThreadReplyCooldownMsDraft(cooldown);
  }, [guildId, guildSettings]);

  const handleSaveGuildSettings = async () => {
    if (!organizationId || !guildId) return;
    try {
      const keywords = escalationKeywordsDraft
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50);

      const threshold = Number(confidenceThresholdDraft);
      const cooldownMs = Number(threadReplyCooldownMsDraft);

      await upsertGuildSettings({
        organizationId: String(organizationId),
        guildId,
        supportAiEnabled: Boolean(supportAiEnabledDraft),
        supportForumChannelId:
          supportForumChannelIdDraft && supportForumChannelIdDraft.trim()
            ? supportForumChannelIdDraft.trim()
            : undefined,
        supportStaffRoleId:
          supportStaffRoleIdDraft && supportStaffRoleIdDraft.trim()
            ? supportStaffRoleIdDraft.trim()
            : undefined,
        escalationKeywords: keywords.length > 0 ? keywords : undefined,
        escalationConfidenceThreshold: Number.isFinite(threshold)
          ? threshold
          : undefined,
        threadReplyCooldownMs: Number.isFinite(cooldownMs) ? cooldownMs : undefined,
        courseUpdatesChannelId:
          courseUpdatesChannelIdDraft && courseUpdatesChannelIdDraft.trim()
            ? courseUpdatesChannelIdDraft.trim()
            : undefined,
      });
      toast.success("Guild settings saved");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    }
  };

  const handleCreateRole = async () => {
    if (!organizationId || !guildId) return;
    const name = newRoleName.trim();
    if (!name) {
      toast.error("Role name is required");
      return;
    }
    try {
      await createRole({
        organizationId: String(organizationId),
        guildId,
        name,
      });
      setNewRoleName("");
      await loadRoles(guildId);
      toast.success("Role created");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to create role");
    }
  };

  const handleRenameRole = async (roleId: string, name: string) => {
    if (!organizationId || !guildId) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await updateRole({
        organizationId: String(organizationId),
        guildId,
        roleId,
        name: trimmed,
      });
      await loadRoles(guildId);
      toast.success("Role updated");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!organizationId || !guildId) return;
    try {
      await deleteRole({
        organizationId: String(organizationId),
        guildId,
        roleId,
      });
      await loadRoles(guildId);
      toast.success("Role deleted");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to delete role");
    }
  };

  const columns: ColumnDefinition<GuildConnection>[] = [
    {
      id: "guildName",
      header: "Server",
      accessorKey: "guildName",
      cell: (g) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{g.guildName ?? "Discord server"}</div>
          <div className="text-muted-foreground font-mono text-xs">{g.guildId}</div>
        </div>
      ),
    },
    {
      id: "botModeAtConnect",
      header: "Bot",
      accessorKey: "botModeAtConnect",
      cell: (g) => (
        <Badge variant="outline">
          {g.botModeAtConnect === "custom" ? "Custom" : "Global"}
        </Badge>
      ),
    },
    {
      id: "connectedAt",
      header: "Connected",
      accessorKey: "connectedAt",
      cell: (g) => (
        <div className="text-muted-foreground text-sm">
          {typeof g.connectedAt === "number" && g.connectedAt > 0
            ? new Date(g.connectedAt).toLocaleString()
            : "—"}
        </div>
      ),
    },
  ];

  const entityActions: EntityAction<GuildConnection>[] = [
    {
      id: "configure",
      label: "Configure",
      icon: <Settings className="h-4 w-4" />,
      onClick: (g) => void handleSelectGuild(g.guildId),
      variant: "outline",
    },
    {
      id: "disconnect",
      label: "Disconnect",
      icon: <Unplug className="h-4 w-4" />,
      onClick: (g) => {
        setPendingDisconnectGuildId(g.guildId);
        setDisconnectConfirmOpen(true);
      },
      variant: "destructive",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discord Server</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push("/admin/edit?plugin=discord&page=settings")}
          >
            Back to settings
          </Button>
          {guildId ? (
            <Button
              variant="outline"
              onClick={() => {
                setPendingDisconnectGuildId(guildId);
                setDisconnectConfirmOpen(true);
              }}
            >
              Disconnect
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog
          open={disconnectConfirmOpen}
          onOpenChange={(open) => setDisconnectConfirmOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect server?</AlertDialogTitle>
              <AlertDialogDescription>
                Disconnect{" "}
                <span className="font-medium">
                  {activeGuild?.guildName ?? "this Discord server"}
                </span>
                ? Users will no longer be synced for this server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDisconnectConfirmOpen(false);
                  setPendingDisconnectGuildId(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const id = pendingDisconnectGuildId;
                  setDisconnectConfirmOpen(false);
                  setPendingDisconnectGuildId(null);
                  if (id) void handleDisconnect(id);
                }}
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {!organizationId ? (
          <div className="text-muted-foreground text-sm">
            Select an organization to configure Discord.
          </div>
        ) : null}

        {!guildId ? (
          <div className="space-y-3">
            <div className="text-muted-foreground text-sm">
              Choose a connected server to configure roles and settings.
            </div>
            <EntityList
              title="Connected servers"
              description="Click Configure to manage roles for a specific server."
              data={guildConnections ?? []}
              columns={columns}
              entityActions={entityActions}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium">
                {activeGuild?.guildName ?? "Discord server"}
              </div>
              <div className="text-muted-foreground font-mono text-xs">{guildId}</div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Support AI</div>
                  <div className="text-muted-foreground text-xs">
                    Configure the forum channel to auto-answer threads and escalate to staff.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Enabled</Label>
                  <Switch
                    checked={supportAiEnabledDraft}
                    onCheckedChange={(checked) => setSupportAiEnabledDraft(Boolean(checked))}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Support forum channel</Label>
                  <Select
                    value={supportForumChannelIdDraft ?? ""}
                    onValueChange={(v) => setSupportForumChannelIdDraft(v || null)}
                  >
                    <SelectTrigger disabled={isLoadingChannels}>
                      <SelectValue
                        placeholder={isLoadingChannels ? "Loading channels..." : "Select forum"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {channels
                        .filter((c) => c.type === 15) // GUILD_FORUM
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Staff role to mention</Label>
                  <Select
                    value={supportStaffRoleIdDraft ?? ""}
                    onValueChange={(v) => setSupportStaffRoleIdDraft(v || null)}
                  >
                    <SelectTrigger disabled={isLoadingRoles}>
                      <SelectValue
                        placeholder={isLoadingRoles ? "Loading roles..." : "Select staff role"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => !r.managed)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Escalation keywords (comma-separated)</Label>
                  <Input
                    value={escalationKeywordsDraft}
                    onChange={(e) => setEscalationKeywordsDraft(e.target.value)}
                    placeholder="refund, chargeback, not working"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Confidence threshold</Label>
                    <Input
                      value={confidenceThresholdDraft}
                      onChange={(e) => setConfidenceThresholdDraft(e.target.value)}
                      placeholder="0.65"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Reply cooldown (ms)</Label>
                    <Input
                      value={threadReplyCooldownMsDraft}
                      onChange={(e) => setThreadReplyCooldownMsDraft(e.target.value)}
                      placeholder="15000"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => void loadChannels(guildId)}
                  disabled={isLoadingChannels}
                >
                  {isLoadingChannels ? "Refreshing..." : "Refresh channels"}
                </Button>
                <Button onClick={() => void handleSaveGuildSettings()}>Save settings</Button>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 text-sm font-medium">Announcements</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Course updates channel</Label>
                  <Select
                    value={courseUpdatesChannelIdDraft ?? ""}
                    onValueChange={(v) => setCourseUpdatesChannelIdDraft(v || null)}
                  >
                    <SelectTrigger disabled={isLoadingChannels}>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels
                        .filter((c) => c.type === 0) // GUILD_TEXT
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={() => void handleSaveGuildSettings()}>Save announcements</Button>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="mb-2 text-sm font-medium">Roles</div>
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label>New role name</Label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. VIP"
                  />
                </div>
                <Button
                  onClick={() => void handleCreateRole()}
                  disabled={isLoadingRoles}
                >
                  Create role
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void loadRoles(guildId)}
                  disabled={isLoadingRoles}
                >
                  {isLoadingRoles ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <div className="space-y-2">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {r.id}
                      </div>
                    </div>
                    {r.managed ? (
                      <div className="text-muted-foreground text-xs">managed</div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRenameRoleNameDraft(r.name);
                            setPendingRenameRoleId(r.id);
                          }}
                        >
                          Rename
                        </Button>
                        <AlertDialog
                          open={pendingRenameRoleId === r.id}
                          onOpenChange={(open) =>
                            setPendingRenameRoleId(open ? r.id : null)
                          }
                        >
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Rename role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Update the role name in Discord.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-2">
                              <Label>Role name</Label>
                              <Input
                                value={renameRoleNameDraft}
                                onChange={(e) =>
                                  setRenameRoleNameDraft(e.currentTarget.value)
                                }
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => setPendingRenameRoleId(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  void handleRenameRole(r.id, renameRoleNameDraft);
                                  setPendingRenameRoleId(null);
                                }}
                              >
                                Save
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog
                          open={pendingDeleteRoleId === r.id}
                          onOpenChange={(open) =>
                            setPendingDeleteRoleId(open ? r.id : null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete{" "}
                                <span className="font-medium">{r.name}</span>{" "}
                                from Discord. This can’t be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => void handleDeleteRole(r.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                ))}

                {roles.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No roles found.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


