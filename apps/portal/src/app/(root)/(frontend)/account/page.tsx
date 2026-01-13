"use client";

import "~/lib/plugins/installHooks";

import type { Doc } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import {
  applyFilters,
  getRegisteredFilters,
  hasFilter,
} from "@acme/admin-runtime/hooks";
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
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { FRONTEND_ACCOUNT_TABS_FILTER } from "~/lib/plugins/hookSlots";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

type PluginOptionDoc = Doc<"options">;

export interface AccountTabsFilterContext {
  organizationId?: string | null;
  enabledPluginIds: string[];
}

export interface AccountTabDefinition {
  id: string;
  label: string;
  value: string;
  order?: number;
  condition?: (ctx: AccountTabsFilterContext) => boolean;
  render: () => ReactNode;
}

const getEnabledPluginIds = (args: {
  pluginOptions: PluginOptionDoc[] | undefined;
}): string[] => {
  const optionMap = new Map(
    (args.pluginOptions ?? []).map((o) => [o.metaKey, Boolean(o.metaValue)]),
  );

  const enabledIds: string[] = [];
  for (const plugin of pluginDefinitions) {
    if (!plugin.activation) {
      enabledIds.push(plugin.id);
      continue;
    }

    const stored = optionMap.get(plugin.activation.optionKey);
    const isEnabled = stored ?? plugin.activation.defaultEnabled ?? false;
    if (isEnabled) enabledIds.push(plugin.id);
  }

  return enabledIds;
};

function GeneralTabContent() {
  const { user, isLoading } = useConvexUser();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const searchParams = useSearchParams();
  const startUserLink = useAction(
    (api as any).plugins.discord.actions.startUserLink,
  );
  const unlinkMyDiscordLink = useAction(
    (api as any).plugins.discord.mutations.unlinkMyDiscordLink,
  );
  const myDiscordLink = useQuery(
    (api as any).plugins.discord.queries.getMyDiscordLink,
    organizationId ? { organizationId } : "skip",
  ) as { discordUserId?: string; linkedAt?: number } | null | undefined;

  const discordLinked = searchParams.get("discord_linked") === "1";
  const discordLinkError = (
    searchParams.get("discord_link_error") ?? ""
  ).trim();
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isLoading ? (
            <div className="text-muted-foreground">Loading your profile…</div>
          ) : !user ? (
            <div className="text-muted-foreground">
              You’re not signed in.{" "}
              <Link className="underline" href="/sign-in">
                Sign in
              </Link>
              .
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="text-muted-foreground">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{user.name ?? "—"}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="text-muted-foreground">Organization role</div>
                <div className="font-medium">{user.role ?? "viewer"}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <AlertDialog
            open={isDisconnectOpen}
            onOpenChange={setIsDisconnectOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Discord?</AlertDialogTitle>
                <AlertDialogDescription>
                  Disconnecting will prevent Discord Support AI from accessing
                  your orders/account details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    setIsDisconnectOpen(false);
                    if (!organizationId) return;
                    void (async () => {
                      try {
                        await unlinkMyDiscordLink({ organizationId });
                        toast.success("Discord disconnected");
                      } catch (e) {
                        console.error(e);
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to disconnect Discord",
                        );
                      }
                    })();
                  }}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {myDiscordLink ? (
            <div className="text-sm text-green-700 dark:text-green-400">
              Discord account linked.
            </div>
          ) : discordLinked ? (
            <div className="text-sm text-green-700 dark:text-green-400">
              Discord account linked.
            </div>
          ) : null}
          {discordLinkError ? (
            <div className="text-destructive text-sm">
              Discord link failed: {discordLinkError}
            </div>
          ) : null}

          <div className="text-muted-foreground">
            Link your Discord account so the support bot can help with
            order/account-specific requests.
          </div>

          <div className="flex flex-wrap gap-2">
            {myDiscordLink ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDisconnectOpen(true);
                  }}
                >
                  Disconnect
                </Button>
                <Button
                  onClick={() => {
                    if (!organizationId) return;
                    if (!user) {
                      toast.error("Please sign in first");
                      return;
                    }
                    void (async () => {
                      try {
                        const { url } = (await startUserLink({
                          organizationId,
                          returnTo: `${window.location.origin}/account`,
                        })) as { url: string };
                        window.location.href = url;
                      } catch (e) {
                        console.error(e);
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to start Discord relink",
                        );
                      }
                    })();
                  }}
                >
                  Relink
                </Button>
              </>
            ) : (
              <Button
                disabled={!user || !organizationId}
                onClick={() => {
                  if (!organizationId) return;
                  if (!user) {
                    toast.error("Please sign in first");
                    return;
                  }

                  void (async () => {
                    try {
                      const { url } = (await startUserLink({
                        organizationId,
                        returnTo: `${window.location.origin}/account`,
                      })) as { url: string };
                      window.location.href = url;
                    } catch (e) {
                      console.error(e);
                      toast.error(
                        e instanceof Error
                          ? e.message
                          : "Failed to start Discord link",
                      );
                    }
                  })();
                }}
              >
                Link Discord account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomizationTabContent() {
  // Intentionally a minimal “built out” UI shell; the save flow depends on where
  // we want to persist cover/profile images (Clerk vs Convex vs both).
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="font-medium">Profile photo</div>
            <div className="text-muted-foreground">
              Change your avatar from the user menu (top right).
            </div>
          </div>
          <Separator />
          <div>
            <div className="font-medium">Cover photo</div>
            <div className="text-muted-foreground">
              Coming next: upload a cover image for your public profile.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const debugPlugins = searchParams.get("debugPlugins") === "1";
  // Convex generated API typing in this repo is inconsistent across modules; avoid lint errors here.
  const apiAny = api as unknown as {
    core: { options: { getByType: unknown } };
  };

  const pluginOptions = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiAny.core.options.getByType as any,
    organizationId
      ? ({ orgId: organizationId, type: "site" } as const)
      : "skip",
  ) as PluginOptionDoc[] | undefined;

  const enabledPluginIds = useMemo(() => {
    return getEnabledPluginIds({ pluginOptions });
  }, [pluginOptions]);

  // The hook/filter system allows plugins to read arbitrary keys from ctx,
  // so we include a debug flag for troubleshooting.
  const filterCtx = useMemo(
    () =>
      ({
        enabledPluginIds,
        organizationId: organizationId ?? null,
        debugPlugins,
      }) satisfies AccountTabsFilterContext & { debugPlugins: boolean },
    [enabledPluginIds, organizationId, debugPlugins],
  );

  const baseTabs = useMemo<AccountTabDefinition[]>(
    () => [
      {
        id: "account-general",
        label: "General",
        value: "general",
        order: 10,
        render: () => <GeneralTabContent />,
      },
      {
        id: "account-customization",
        label: "Customization",
        value: "customization",
        order: 30,
        render: () => <CustomizationTabContent />,
      },
    ],
    [],
  );

  const tabs = useMemo(() => {
    const hookName = FRONTEND_ACCOUNT_TABS_FILTER;
    const filtered = applyFilters(hookName, baseTabs, filterCtx);
    const result: AccountTabDefinition[] = Array.isArray(filtered)
      ? (filtered as AccountTabDefinition[])
      : baseTabs;

    return result
      .filter((t) => (t.condition ? t.condition(filterCtx) : true))
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label),
      );
  }, [baseTabs, filterCtx]);

  const defaultValue = tabs[0]?.value ?? "general";
  const activeValue =
    tabs.find((t) => t.value === searchParams.get("tab"))?.value ??
    defaultValue;

  if (debugPlugins && typeof window !== "undefined") {
    console.log("[account][debugPlugins=1] orgId", organizationId);
    console.log("[account][debugPlugins=1] enabledPluginIds", enabledPluginIds);
    console.log(
      "[account][debugPlugins=1] hasFilter(frontend.account.tabs)",
      hasFilter(FRONTEND_ACCOUNT_TABS_FILTER),
    );
    console.log(
      "[account][debugPlugins=1] registeredFilters includes frontend.account.tabs",
      getRegisteredFilters().includes(FRONTEND_ACCOUNT_TABS_FILTER),
    );
    console.log(
      "[account][debugPlugins=1] registeredFilters",
      getRegisteredFilters(),
    );
    console.log(
      "[account][debugPlugins=1] baseTabs",
      baseTabs.map((t) => ({ id: t.id, value: t.value, label: t.label })),
    );
    console.log(
      "[account][debugPlugins=1] finalTabs",
      tabs.map((t) => ({ id: t.id, value: t.value, label: t.label })),
    );
  }

  const tabsListColsClass =
    tabs.length <= 1
      ? "grid-cols-1"
      : tabs.length === 2
        ? "grid-cols-2"
        : tabs.length === 3
          ? "grid-cols-3"
          : tabs.length === 4
            ? "grid-cols-4"
            : "grid-cols-5";

  return (
    <div className="fl container flex-1 py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Account</h1>
      </div>

      <Tabs
        value={activeValue}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams.toString());
          if (value === defaultValue) {
            next.delete("tab");
          } else {
            next.set("tab", value);
          }
          // If navigating away from Orders, clear the order details selection.
          if (value !== "orders") {
            next.delete("orderId");
          }

          const qs = next.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, {
            scroll: false,
          });
        }}
        className="space-y-6"
      >
        <TabsList className={`grid w-full max-w-2xl ${tabsListColsClass}`}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.value} className="space-y-6">
            {tab.render()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
