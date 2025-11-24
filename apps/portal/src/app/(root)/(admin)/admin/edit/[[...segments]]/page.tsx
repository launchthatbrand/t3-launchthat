/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import type { PluginSingleViewInstance } from "../_components/AdminSinglePostView";
import type { PermalinkSettings } from "../_components/permalink";
import {
  AdminLayoutContent,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { AdminSinglePostView } from "../_components/AdminSinglePostView";
import { AttachmentsArchiveView } from "../_components/AttachmentsArchiveView";
import { GenericArchiveView } from "../_components/GenericArchiveView";
import {
  defaultPermalinkSettings,
  isPermalinkSettingsValue,
} from "../_components/permalink";
import { TaxonomyTermsView } from "../_components/TaxonomyTermsView";
import { useAdminPostContext } from "../../_providers/AdminPostProvider";
import { usePostTypes } from "../../settings/post-types/_api/postTypes";

const DEFAULT_POST_TYPE = "course";
const PERMALINK_OPTION_KEY = "permalink_settings";

type PostTypeDoc = Doc<"postTypes">;

function AdminEditPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const { data: postTypesResponse } = usePostTypes();
  const postTypes = useMemo<Doc<"postTypes">[]>(() => {
    if (postTypesResponse === undefined) {
      return [];
    }
    return postTypesResponse;
  }, [postTypesResponse]);
  const pluginParam = searchParams.get("plugin")?.toLowerCase().trim() ?? "";
  const pluginPage =
    searchParams.get("page")?.toLowerCase().trim() ?? "settings";
  const pluginDefinition = useMemo(() => {
    if (!pluginParam) return null;
    return (
      pluginDefinitions.find(
        (candidate) => candidate.id.toLowerCase() === pluginParam,
      ) ?? null
    );
  }, [pluginParam]);
  const pluginSetting = useMemo(() => {
    if (!pluginDefinition?.settingsPages?.length) {
      return null;
    }
    const fallbackSetting =
      pluginDefinition.settingsPages.length > 0
        ? pluginDefinition.settingsPages[0]
        : null;
    const explicitSetting = pluginDefinition.settingsPages.find(
      (setting) => setting.slug === pluginPage,
    );
    return explicitSetting ?? fallbackSetting;
  }, [pluginDefinition, pluginPage]);
  const organizationId = useMemo(
    () => getTenantOrganizationId(tenant ?? undefined),
    [tenant],
  );
  const pluginSettingContent = useMemo(() => {
    if (!pluginDefinition || !pluginSetting) return null;
    return pluginSetting.render({
      pluginId: pluginDefinition.id,
      pluginName: pluginDefinition.name,
      settingId: pluginSetting.id,
      organizationId,
    });
  }, [pluginDefinition, pluginSetting, organizationId]);
  const { viewMode, post, postType, postTypeSlug, isLoading, isNewRecord } =
    useAdminPostContext();
  const permalinkOption = useQuery(api.core.options.get, {
    metaKey: PERMALINK_OPTION_KEY,
    type: "site",
  } as const);
  const taxonomySlugParam =
    searchParams.get("taxonomy")?.toLowerCase().trim() ?? "";

  const resolvedSlug = (postTypeSlug ?? DEFAULT_POST_TYPE).toLowerCase();
  const permalinkSettings = useMemo<PermalinkSettings>(() => {
    const rawValue = permalinkOption?.metaValue as unknown;
    if (isPermalinkSettingsValue(rawValue)) {
      return { ...defaultPermalinkSettings, ...rawValue };
    }
    return defaultPermalinkSettings;
  }, [permalinkOption]);

  const hydratedPostType = useMemo(() => {
    if (postType) return postType;
    return (
      postTypes.find((pt: PostTypeDoc) => pt.slug === resolvedSlug) ?? null
    );
  }, [postType, postTypes, resolvedSlug]);

  const handlePostTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("post_type", value);
    params.delete("post_id");
    router.replace(`/admin/edit?${params.toString()}`);
  };

  const pluginSingleView = useMemo(() => {
    if (!hydratedPostType) return null;
    return getPluginSingleViewForSlug(hydratedPostType.slug);
  }, [hydratedPostType]);

  if (pluginParam && !pluginDefinition) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <Card>
            <CardHeader>
              <CardTitle>Plugin not found</CardTitle>
              <CardDescription>
                The requested plugin could not be located.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/admin/integrations/plugins">Back to plugins</Link>
              </Button>
            </CardContent>
          </Card>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  if (pluginParam && pluginDefinition && pluginSetting) {
    return (
      <AdminLayoutContent>
        <AdminLayoutMain>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Admin / Integrations / {pluginDefinition.name}
                </p>
                <h1 className="text-3xl font-bold">
                  {pluginDefinition.name} Settings
                </h1>
                <p className="text-muted-foreground">
                  {pluginDefinition.longDescription ??
                    pluginDefinition.description}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/integrations/plugins">Back to plugins</Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{pluginSetting.label}</CardTitle>
                {pluginSetting.description ? (
                  <CardDescription>{pluginSetting.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {pluginSettingContent ?? (
                  <p className="text-sm text-muted-foreground">
                    This plugin does not expose configurable settings yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    );
  }

  if (taxonomySlugParam) {
    return (
      <TaxonomyTermsView
        taxonomySlug={taxonomySlugParam}
        postTypeSlug={resolvedSlug}
        postTypes={postTypes}
        onPostTypeChange={handlePostTypeChange}
      />
    );
  }

  if (viewMode === "single") {
    return (
      <AdminSinglePostView
        post={post}
        postType={hydratedPostType}
        slug={resolvedSlug}
        isNewRecord={isNewRecord}
        organizationId={organizationId ?? undefined}
        pluginSingleView={pluginSingleView}
        onBack={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("post_id");
          router.replace(`/admin/edit?${params.toString()}`);
        }}
      />
    );
  }

  if (resolvedSlug === "attachment" || resolvedSlug === "attachments") {
    return (
      <AttachmentsArchiveView
        slug={resolvedSlug}
        postType={hydratedPostType}
        options={postTypes}
        onPostTypeChange={handlePostTypeChange}
      />
    );
  }

  return (
    <GenericArchiveView
      slug={resolvedSlug}
      postType={hydratedPostType}
      options={postTypes}
      isLoading={isLoading}
      permalinkSettings={permalinkSettings}
      onPostTypeChange={handlePostTypeChange}
      onCreate={() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("post_type", resolvedSlug);
        params.set("post_id", "new");
        router.replace(`/admin/edit?${params.toString()}`);
      }}
    />
  );
}

export default function AdminEditPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading editor…</div>}>
      <AdminEditPageBody />
    </Suspense>
  );
}

function getPluginSingleViewForSlug(
  slug: string,
): PluginSingleViewInstance | null {
  for (const plugin of pluginDefinitions) {
    const postType = plugin.postTypes.find((type) => type.slug === slug);
    if (postType?.singleView) {
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        config: postType.singleView,
      };
    }
  }
  return null;
}
