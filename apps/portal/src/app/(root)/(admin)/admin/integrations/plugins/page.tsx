"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMemo, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

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
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import type {
  PluginDefinition,
  PluginPostTypeConfig,
} from "~/lib/plugins/types";
import { useTenant } from "~/context/TenantContext";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import {
  useCreatePostType,
  useDisablePostTypeAccess,
  useEnsurePostTypeAccess,
  usePostTypes,
} from "../../settings/post-types/_api/postTypes";

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

export default function PluginsPage() {
  const { data: postTypes, isLoading } = usePostTypes(true);
  const createPostType = useCreatePostType();
  const ensurePostTypeAccess = useEnsurePostTypeAccess();
  const disablePostTypeAccess = useDisablePostTypeAccess();
  const [isPending, startTransition] = useTransition();
  const tenant = useTenant();
  const tenantId = tenant?._id;

  const plugins = useMemo<PluginDefinition[]>(() => pluginDefinitions, []);

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
      return {
        pluginId: plugin.id,
        isEnabled: missing.length === 0,
        missingSlugs: missing.map((type) => type.slug),
      };
    });
  }, [postTypes, plugins, tenantId]);

  const handleEnablePlugin = (plugin: PluginDefinition) => {
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
        for (const type of plugin.postTypes) {
          try {
            await ensurePostTypeAccess(type.slug);
          } catch (error: unknown) {
            const normalizedError = normalizeError(error);
            if (normalizedError.message.includes("not found")) {
              await createPostType({
                ...type,
              });
            } else {
              throw normalizedError;
            }
          }
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
  };

  const handleDisablePlugin = (plugin: PluginDefinition) => {
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal Plugins</h1>
        <p className="text-muted-foreground">
          Enable suites of features for each organization. Plugins provision
          post types, menu entries and API endpoints—similar to WordPress post
          types.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {plugins.map((plugin) => {
          const status = pluginStatus.find(
            (state) => state.pluginId === plugin.id,
          );
          const isEnabled = status?.isEnabled;

          return (
            <Card key={plugin.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{plugin.name}</CardTitle>
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {plugin.longDescription}
                </p>
                <div>
                  <p className="text-sm font-medium">Feature Highlights</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {plugin.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium">Provisioned Post Types</p>
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
                            <p className="text-xs text-muted-foreground">
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
                </div>

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
                {isEnabled ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="secondary"
                        disabled={isPending || isLoading}
                      >
                        {isPending ? "Updating…" : "Disable Plugin"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Disable {plugin.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Disabling removes the related post types and menu
                          items for this organization. Existing content is not
                          deleted, but authors will lose access until the plugin
                          is enabled again.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDisablePlugin(plugin)}
                          disabled={isPending}
                        >
                          Disable plugin
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <>
                    <Button
                      disabled={isPending || isLoading}
                      onClick={() => handleEnablePlugin(plugin)}
                    >
                      {isPending ? "Provisioning…" : "Enable Plugin"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {status?.missingSlugs.length
                        ? `Needs ${status.missingSlugs.length} post type(s)`
                        : "Ready to enable"}
                    </p>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
