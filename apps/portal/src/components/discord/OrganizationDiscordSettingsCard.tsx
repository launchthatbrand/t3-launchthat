"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/array-type,
*/
import type { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { Settings, Unplug } from "lucide-react";
import { toast } from "sonner";

import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";

export const OrganizationDiscordSettingsCard = (props: {
  organizationId: Id<"organizations">;
}) => {
  const { organizationId } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledInstallRef = React.useRef<string | null>(null);

  // IMPORTANT: Avoid importing the typed Convex `api` in this file — it can trigger TS
  // "type instantiation is excessively deep". Pull the api via require() to keep it `any`.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiAny: any = require("@/convex/_generated/api").api;

  // Avoid TS "type instantiation is excessively deep" by erasing the generated Convex API types
  // and calling the hooks via untyped overloads.
  const useQueryUntyped = useQuery as unknown as (
    func: unknown,
    args: unknown,
  ) => unknown;
  const useActionUntyped = useAction as unknown as (func: unknown) => unknown;

  const discordQueries = apiAny.plugins.discord.queries;
  const discordActions = apiAny.plugins.discord.actions;

  const config = useQueryUntyped(discordQueries.getOrgConfig, {
    organizationId: String(organizationId),
  }) as any;

  const upsertOrgConfigV2 = useActionUntyped(
    discordActions.upsertOrgConfigV2,
  ) as any;
  const startBotInstall = useActionUntyped(
    discordActions.startBotInstall,
  ) as any;
  const completeBotInstall = useActionUntyped(
    discordActions.completeBotInstall,
  ) as any;
  const disconnectGuild = useActionUntyped(
    discordActions.disconnectGuild,
  ) as any;

  const listGuildConnections = useQueryUntyped(
    discordQueries.listGuildConnectionsForOrg,
    { organizationId: String(organizationId) },
  ) as any;

  const [enabled, setEnabled] = React.useState(false);
  const [botMode, setBotMode] = React.useState<"global" | "custom">("global");
  const [customClientId, setCustomClientId] = React.useState("");
  const [customClientSecret, setCustomClientSecret] = React.useState("");
  const [customBotToken, setCustomBotToken] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [pendingDisconnectGuild, setPendingDisconnectGuild] = React.useState<{
    guildId: string;
    guildName?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!config) return;
    setEnabled(Boolean(config.enabled));
    setBotMode(config.botMode === "custom" ? "custom" : "global");
    setCustomClientId(config.customClientId ?? "");
    // Secrets are not returned from Convex; keep local inputs empty.
  }, [config]);

  // Handle bot install callback: Discord returns `guild_id` and `state` (and sometimes `code`).
  React.useEffect(() => {
    const guildId = searchParams.get("guild_id");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    if (error) {
      toast.error(`Discord install failed: ${error}`);
      router.replace("/admin/edit?plugin=discord&page=settings");
      return;
    }
    if (!guildId || !state) return;

    // React Strict Mode can run effects twice in dev, which would consume the one-time `state`
    // twice (first call succeeds, second fails with "Invalid or expired ... state").
    const key = `${state}::${guildId}`;
    if (handledInstallRef.current === key) return;
    handledInstallRef.current = key;

    void (async () => {
      try {
        await completeBotInstall({ state, guildId });
        toast.success("Discord bot connected to server");
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error ? e.message : "Failed to connect server",
        );
      } finally {
        router.replace("/admin/edit?plugin=discord&page=settings");
      }
    })();
  }, [completeBotInstall, router, searchParams]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await upsertOrgConfigV2({
        organizationId: String(organizationId),
        enabled,
        botMode,
        customClientId:
          botMode === "custom" ? customClientId.trim() : undefined,
        customClientSecret:
          botMode === "custom" ? customClientSecret.trim() : undefined,
        customBotToken:
          botMode === "custom" ? customBotToken.trim() : undefined,
      });
      toast.success("Discord settings saved");
      setCustomClientSecret("");
      setCustomBotToken("");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save Discord settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstallBot = async () => {
    try {
      setIsInstalling(true);
      const { url } = await startBotInstall({
        organizationId: String(organizationId),
        returnTo: `${window.location.origin}/admin/edit?plugin=discord&page=settings`,
      });
      window.location.href = url;
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to start bot install",
      );
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDisconnectGuild = async (guildId: string) => {
    try {
      await disconnectGuild({
        organizationId: String(organizationId),
        guildId,
      });
      toast.success("Disconnected server");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to disconnect");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discord</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="discord-enabled" className="text-sm">
            Enabled
          </Label>
          <Switch
            id="discord-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlertDialog
          open={pendingDisconnectGuild != null}
          onOpenChange={(open) =>
            setPendingDisconnectGuild(open ? pendingDisconnectGuild : null)
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect server?</AlertDialogTitle>
              <AlertDialogDescription>
                Disconnect{" "}
                <span className="font-medium">
                  {pendingDisconnectGuild?.guildName ?? "this Discord server"}
                </span>
                ? Users will no longer be synced for this server.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setPendingDisconnectGuild(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  const g = pendingDisconnectGuild;
                  setPendingDisconnectGuild(null);
                  if (g) void handleDisconnectGuild(g.guildId);
                }}
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-muted-foreground text-sm">
          Connect one or more Discord servers (guilds), manage roles, and
          configure role assignment rules.
        </p>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Use own bot</div>
            <div className="text-muted-foreground text-xs">
              Off = use the shared Launchthat bot. On = use credentials you
              provide.
            </div>
          </div>
          <Switch
            checked={botMode === "custom"}
            onCheckedChange={(checked) =>
              setBotMode(checked ? "custom" : "global")
            }
          />
        </div>

        {botMode === "custom" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Discord Client ID</Label>
              <Input
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Redirect URI (add to your Discord app)</Label>
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/admin/edit?plugin=discord&page=settings`}
              />
            </div>
            <div className="space-y-2">
              <Label>Discord Client Secret</Label>
              <Input
                type="password"
                value={customClientSecret}
                onChange={(e) => setCustomClientSecret(e.target.value)}
                placeholder={
                  config?.hasClientSecret ? "•••••••• (already saved)" : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <Input
                type="password"
                value={customBotToken}
                onChange={(e) => setCustomBotToken(e.target.value)}
                placeholder={
                  config?.hasBotToken ? "•••••••• (already saved)" : ""
                }
              />
            </div>
          </div>
        ) : (
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Shared Launchthat bot</div>
            <div className="text-muted-foreground text-xs">
              Click “Add Bot to Server” to install the shared bot into one or
              more Discord servers.
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleInstallBot()}
            disabled={isInstalling}
          >
            {isInstalling ? "Opening Discord..." : "Add Bot to Server"}
          </Button>
        </div>

        <div className="rounded-md border p-3">
          <EntityList
            title="Connected servers"
            description="Click Configure to manage roles for a specific server."
            data={(listGuildConnections ?? []) as Array<any>}
            columns={
              [
                {
                  id: "guildName",
                  header: "Server",
                  accessorKey: "guildName",
                  cell: (g: any) => (
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {g.guildName ?? "Discord server"}
                      </div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {g.guildId}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "botModeAtConnect",
                  header: "Bot",
                  accessorKey: "botModeAtConnect",
                  cell: (g: any) => (
                    <Badge variant="outline">
                      {g.botModeAtConnect === "custom" ? "Custom" : "Global"}
                    </Badge>
                  ),
                },
                {
                  id: "connectedAt",
                  header: "Connected",
                  accessorKey: "connectedAt",
                  cell: (g: any) => (
                    <div className="text-muted-foreground text-sm">
                      {typeof g.connectedAt === "number" && g.connectedAt > 0
                        ? new Date(g.connectedAt).toLocaleString()
                        : "—"}
                    </div>
                  ),
                },
              ] as ColumnDefinition<any>[]
            }
            entityActions={
              [
                {
                  id: "configure",
                  label: "Configure",
                  icon: <Settings className="h-4 w-4" />,
                  onClick: (g: any) => {
                    router.push(
                      `/admin/edit?plugin=discord&page=serverconfig&guildId=${encodeURIComponent(
                        String(g.guildId),
                      )}`,
                    );
                  },
                  variant: "outline",
                },
                {
                  id: "disconnect",
                  label: "Disconnect",
                  icon: <Unplug className="h-4 w-4" />,
                  onClick: (g: any) =>
                    setPendingDisconnectGuild({
                      guildId: String(g.guildId),
                      guildName:
                        typeof g.guildName === "string"
                          ? g.guildName
                          : undefined,
                    }),
                  variant: "destructive",
                },
              ] as EntityAction<any>[]
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
