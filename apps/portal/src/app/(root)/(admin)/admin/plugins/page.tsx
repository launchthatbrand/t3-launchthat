"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@acme/ui/accordion";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type {
  PluginDefinition,
  PluginPostTypeConfig,
} from "~/lib/plugins/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  useCreatePostType,
  useDisablePostTypeAccess,
  useEnsurePostTypeAccess,
  usePostTypes,
} from "../settings/post-types/_api/postTypes";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import Link from "next/link";
import { Separator } from "@acme/ui/separator";
import { api } from "@/convex/_generated/api";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { toast } from "sonner";
import { useTenant } from "~/context/TenantContext";

const isPostTypeEnabledForTenant = (
  postType: Doc<"postTypes">,
  organizationId?: Id<"organizations">,
) => {
  if (!organizationId) return true;

  const enabledIds = postType.enabledOrganizationIds;
  if (enabledIds !== undefined) {
    if (enabledIds.length === 0) {
      return false;
    }
    return enabledIds.includes(organizationId);
  }

  if (postType.organizationId) {
    return postType.organizationId === organizationId;
  }

  return true;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  return new Error("Unknown error occurred");
};

type PluginRow = PluginDefinition &
  Record<string, unknown> & {
    isEnabled: boolean;
    missingSlugs: string[];
    activationEnabled: boolean;
  };

export default function PluginsPage() {
  const { data: postTypes, isLoading } = usePostTypes(true);
  const createPostType = useCreatePostType();
  const ensurePostTypeAccess = useEnsurePostTypeAccess();
  const disablePostTypeAccess = useDisablePostTypeAccess();
  const setOption = useMutation(api.core.options.set);
  const ensureQuizQuestionPostType = useMutation(
    api.plugins.lms.mutations.ensureQuizQuestionPostType,
  );
  const [isPending, startTransition] = useTransition();
  const [pluginToDisable, setPluginToDisable] = useState<PluginRow | null>(
    null,
  );
  const tenant = useTenant();
  const tenantId = tenant?._id;
  const organizationId = getTenantOrganizationId(tenant);

  const plugins = useMemo<PluginDefinition[]>(() => pluginDefinitions, []);

  const portalAwareOrgId = organizationId ?? tenantId;
  const pluginOptions = useQuery(
    api.core.options.getByType,
    portalAwareOrgId ? { orgId: portalAwareOrgId, type: "site" } : "skip",
  );

  const pluginOptionMap = useMemo(() => {
    if (!Array.isArray(pluginOptions)) {
      return new Map<string, boolean>();
    }
    return new Map<string, boolean>(
      pluginOptions.map((option) => [
        option.metaKey,
        Boolean(option.metaValue),
      ]),
    );
  }, [pluginOptions]);

  useEffect(() => {
    console.log("[plugins] option payload", { pluginOptions, pluginOptionMap });
  }, [pluginOptions, pluginOptionMap]);

  const isActivationEnabled = useCallback(
    (plugin: PluginDefinition) => {
      if (!plugin.activation) {
        return true;
      }
      const stored = pluginOptionMap.get(plugin.activation.optionKey);
      if (stored === undefined) {
        return plugin.activation.defaultEnabled ?? false;
      }
      return stored;
    },
    [pluginOptionMap],
  );

  const pluginStatus = useMemo(() => {
    console.log("[plugins] recompute status", {
      tenantId,
      postTypeCount: postTypes.length,
      postTypes,
    });
    const availability = new Set(
      postTypes
        .filter((type: Doc<"postTypes">) =>
          isPostTypeEnabledForTenant(type, tenantId),
        )
        .map((postType: Doc<"postTypes">) => postType.slug),
    );
    return plugins.map((plugin) => {
      const missing = plugin.postTypes.filter(
        (type: PluginPostTypeConfig) => !availability.has(type.slug),
      );
      console.log("[plugins] plugin availability", {
        tenantId,
        pluginId: plugin.id,
        missingSlugs: missing.map((type) => type.slug),
      });
      const activationEnabled = isActivationEnabled(plugin);
      return {
        pluginId: plugin.id,
        isEnabled: missing.length === 0 && activationEnabled,
        missingSlugs: missing.map((type) => type.slug),
        activationEnabled,
      };
    });
  }, [postTypes, plugins, tenantId, isActivationEnabled]);

  const handleEnablePlugin = useCallback(
    (plugin: PluginDefinition) => {
      if (!tenantId) {
        toast.error("Select an organization before enabling plugins.");
        return;
      }

      console.log("[plugins] enable start", {
        tenantId,
        pluginId: plugin.id,
      });

      startTransition(async () => {
        try {
          type CreatePostTypeArgs = Parameters<typeof createPostType>[0];
          // Universally sync plugin post types to match the plugin definition:
          // 1) ensure the post type exists (create if missing)
          // 2) apply the definition payload on enable (including adminMenu.enabled, storageKind, metaBoxes, etc.)
          for (const type of plugin.postTypes) {
            try {
              const result = await ensurePostTypeAccess(type);
              console.log("[plugins] ensured post type", {
                tenantId,
                pluginId: plugin.id,
                slug: type.slug,
                result,
                adminMenu: type.adminMenu,
                storageKind: type.storageKind,
                storageTables: type.storageTables,
              });
            } catch (error: unknown) {
              const normalizedError = normalizeError(error);
              if (normalizedError.message.includes("not found")) {
                const created = await createPostType(
                  type as CreatePostTypeArgs,
                );
                console.log("[plugins] created post type", {
                  tenantId,
                  pluginId: plugin.id,
                  slug: type.slug,
                  created,
                  adminMenu: type.adminMenu,
                  storageKind: type.storageKind,
                  storageTables: type.storageTables,
                });
              } else {
                throw normalizedError;
              }
            }
          }
          if (plugin.activation) {
            const optionResult = await setOption({
              metaKey: plugin.activation.optionKey,
              metaValue: true,
              orgId: tenantId,
              type: plugin.activation.optionType ?? "site",
            });
            console.log("[plugins] set option", {
              tenantId,
              pluginId: plugin.id,
              optionKey: plugin.activation.optionKey,
              optionResult,
            });
          }
          if (plugin.id === "lms") {
            await ensureQuizQuestionPostType({
              organizationId: tenantId,
            });
          }
          toast.success(`${plugin.name} plugin enabled`);
          console.log("[plugins] enable success", {
            tenantId,
            pluginId: plugin.id,
          });
        } catch (cause: unknown) {
          const normalizedError = normalizeError(cause);
          console.error(normalizedError);
          toast.error(`Failed to enable ${plugin.name}`, {
            description: normalizedError.message,
          });
        }
      });
    },
    [
      tenantId,
      startTransition,
      ensurePostTypeAccess,
      createPostType,
      setOption,
      ensureQuizQuestionPostType,
    ],
  );

  const handleDisablePlugin = useCallback(
    (plugin: PluginDefinition) => {
      if (!tenantId) {
        toast.error("Select an organization before disabling plugins.");
        return;
      }

      console.log("[plugins] disable start", {
        tenantId,
        pluginId: plugin.id,
      });

      startTransition(async () => {
        try {
          for (const type of plugin.postTypes) {
            await disablePostTypeAccess(type.slug);
          }
          if (plugin.activation) {
            await setOption({
              metaKey: plugin.activation.optionKey,
              metaValue: false,
              orgId: tenantId,
              type: plugin.activation.optionType ?? "site",
            });
          }
          toast.success(`${plugin.name} plugin disabled`);
          console.log("[plugins] disable success", {
            tenantId,
            pluginId: plugin.id,
          });
        } catch (cause: unknown) {
          const normalizedError = normalizeError(cause);
          console.error(normalizedError);
          toast.error(`Failed to disable ${plugin.name}`, {
            description: normalizedError.message,
          });
        }
      });
    },
    [tenantId, startTransition, disablePostTypeAccess, setOption],
  );

  const pluginRows = useMemo<PluginRow[]>(() => {
    return plugins.map((plugin) => {
      const status = pluginStatus.find((state) => state.pluginId === plugin.id);
      return {
        ...plugin,
        isEnabled: status?.isEnabled ?? false,
        missingSlugs: status?.missingSlugs ?? [],
        activationEnabled: status?.activationEnabled ?? false,
      };
    });
  }, [plugins, pluginStatus]);

  useEffect(() => {
    console.log("[plugins] rows snapshot", {
      rows: pluginRows.map((row) => ({
        id: row.id,
        isEnabled: row.isEnabled,
        missingSlugs: row.missingSlugs,
        activationEnabled: row.activationEnabled,
      })),
    });
  }, [pluginRows]);

  const columns = useMemo<ColumnDefinition<PluginRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Plugin",
        cell: (item: PluginRow) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground text-sm">
              {item.description}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (item: PluginRow) => (
          <Badge variant={item.isEnabled ? "default" : "secondary"}>
            {item.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        ),
      },
      {
        id: "missing",
        header: "Missing Post Types",
        cell: (item: PluginRow) =>
          item.missingSlugs.length ? (
            <span className="text-muted-foreground text-sm">
              {item.missingSlugs.join(", ")}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">None</span>
          ),
      },
      {
        id: "listActions",
        header: "Actions",
        cell: (item: PluginRow) => (
          <div className="flex justify-end">
            {item.isEnabled ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPluginToDisable(item)}
                disabled={isPending || isLoading}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleEnablePlugin(item)}
                disabled={isPending || isLoading}
              >
                Activate
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleEnablePlugin, isLoading, isPending],
  );

  return (
    <div className="container space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold">Portal Plugins</h1>
        <p className="text-muted-foreground">
          Enable suites of features for each organization. Plugins provision
          post types, menu entries and API endpoints—similar to WordPress post
          types.
        </p>
      </div>

      <Separator />

      <EntityList<PluginRow>
        data={pluginRows}
        columns={columns}
        isLoading={isLoading}
        enableSearch
        enableFooter={false}
        viewModes={["grid", "list"]}
        defaultViewMode="list"
        gridColumns={{ sm: 1, md: 3 }}
        className="pt-2"
        itemRender={(plugin: PluginRow) => (
          <Card key={plugin.id} className="flex h-full flex-col">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle>{plugin.name}</CardTitle>
                <Badge variant={plugin.isEnabled ? "default" : "secondary"}>
                  {plugin.isEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <CardDescription>{plugin.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {plugin.longDescription}
              </p>
              <div>
                <p className="text-sm font-medium">Feature Highlights</p>
                <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                  {plugin.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <Accordion type="single" collapsible value="post-types">
                <AccordionItem value="post-types">
                  <AccordionTrigger>
                    <p className="text-sm font-medium">
                      Provisioned Post Types
                    </p>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm font-medium">
                      Provisioned Post Types
                    </p>
                    <div className="mt-2 grid gap-2">
                      {plugin.postTypes.map((type) => {
                        const exists = postTypes.some(
                          (existing: Doc<"postTypes">) =>
                            existing.slug === type.slug,
                        );
                        return (
                          <div
                            key={type.slug}
                            className="flex flex-wrap items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium">{type.name}</p>
                              <p className="text-muted-foreground text-xs">
                                Slug: {type.slug}
                              </p>
                            </div>
                            <Badge
                              variant={exists ? "outline" : "secondary"}
                              className="mt-2 md:mt-0"
                            >
                              {exists ? "Exists" : "Will be created"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              {plugin.settingsPages?.length ? (
                <div className="rounded-md border px-3 py-2">
                  <p className="text-sm font-medium">Plugin Settings</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plugin.settingsPages.map((setting) => (
                      <Button
                        key={`${plugin.id}-${setting.id}`}
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        asChild
                      >
                        <Link
                          href={`/admin/edit?plugin=${plugin.id}&page=${setting.slug}`}
                        >
                          {setting.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="mt-auto flex items-center gap-3">
              {plugin.isEnabled ? (
                <Button
                  variant="secondary"
                  disabled={isPending || isLoading}
                  onClick={() => setPluginToDisable(plugin)}
                >
                  {isPending ? "Updating…" : "Disable Plugin"}
                </Button>
              ) : (
                <>
                  <Button
                    disabled={isPending || isLoading}
                    onClick={() => handleEnablePlugin(plugin)}
                  >
                    {isPending ? "Provisioning…" : "Enable Plugin"}
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    {plugin.missingSlugs.length
                      ? `Needs ${plugin.missingSlugs.length} post type(s)`
                      : "Ready to enable"}
                  </p>
                </>
              )}
            </CardFooter>
          </Card>
        )}
        emptyState={
          <div className="text-muted-foreground rounded-md border p-6 text-center">
            No plugins found.
          </div>
        }
      />
      <AlertDialog
        open={pluginToDisable !== null}
        onOpenChange={(open) => {
          if (!open) setPluginToDisable(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable {pluginToDisable?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Disabling removes the related post types and menu items for this
              organization. Existing content is not deleted, but authors will
              lose access until the plugin is enabled again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pluginToDisable) {
                  handleDisablePlugin(pluginToDisable);
                }
                setPluginToDisable(null);
              }}
              disabled={isPending}
            >
              Disable plugin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
