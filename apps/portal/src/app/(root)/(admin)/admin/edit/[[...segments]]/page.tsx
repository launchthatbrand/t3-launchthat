/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import "@/lib/plugins/vimeo/configureClient";

import type { Doc } from "@/convex/_generated/dataModel";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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

import type { PermalinkSettings } from "../_components/permalink";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import {
  getPluginArchiveViewForSlug,
  getPluginSingleViewForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { AdminSinglePostView } from "../_components/AdminSinglePostView";
import { AttachmentsArchiveView } from "../_components/AttachmentsArchiveView";
import { GenericArchiveView } from "../_components/GenericArchiveView";
import {
  defaultPermalinkSettings,
  isPermalinkSettingsValue,
} from "../_components/permalink";
import { PlaceholderState } from "../_components/PlaceholderState";
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

  const handlePostTypeChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("post_type", value);
      params.delete("post_id");
      router.replace(`/admin/edit?${params.toString()}`);
    },
    [router, searchParams],
  );

  const pluginSingleView = useMemo(() => {
    if (!hydratedPostType) return null;
    return getPluginSingleViewForSlug(hydratedPostType.slug);
  }, [hydratedPostType]);

  const pluginArchiveView = useMemo(() => {
    if (!hydratedPostType) return null;
    return getPluginArchiveViewForSlug(hydratedPostType.slug);
  }, [hydratedPostType]);

  const archiveTabs = useMemo(
    () => pluginArchiveView?.config.tabs ?? [],
    [pluginArchiveView],
  );
  const archiveDefaultTab = useMemo(() => {
    if (!pluginArchiveView) {
      return "list";
    }
    return (
      pluginArchiveView.config.defaultTab ??
      pluginArchiveView.config.tabs[0]?.slug ??
      "list"
    );
  }, [pluginArchiveView]);
  const archiveTabParam =
    searchParams.get("tab")?.toLowerCase().trim() ??
    searchParams.get("page")?.toLowerCase().trim() ??
    archiveDefaultTab;
  const normalizedArchiveTab = useMemo(() => {
    if (!pluginArchiveView) {
      return archiveDefaultTab;
    }
    return archiveTabs.some((tab) => tab.slug === archiveTabParam)
      ? archiveTabParam
      : archiveDefaultTab;
  }, [archiveDefaultTab, archiveTabParam, archiveTabs, pluginArchiveView]);
  const [activeArchiveTab, setActiveArchiveTab] =
    useState(normalizedArchiveTab);
  useEffect(() => {
    setActiveArchiveTab(normalizedArchiveTab);
  }, [normalizedArchiveTab]);
  const handleArchiveTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === archiveDefaultTab) {
        params.delete("tab");
        params.delete("page");
      } else {
        params.set("tab", value);
        params.delete("page");
      }
      router.replace(`/admin/edit?${params.toString()}`);
    },
    [archiveDefaultTab, router, searchParams],
  );

  const handleCreate = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("post_type", resolvedSlug);
    params.set("post_id", "new");
    router.replace(`/admin/edit?${params.toString()}`);
  }, [resolvedSlug, router, searchParams]);

  const renderGenericArchive = useCallback(
    (renderLayout: boolean, targetSlug?: string) => {
      const slugToUse = targetSlug ?? resolvedSlug;
      const targetPostType =
        postTypes.find((type) => type.slug === slugToUse) ?? hydratedPostType;
      if (slugToUse === "attachment" || slugToUse === "attachments") {
        return (
          <AttachmentsArchiveView
            slug={slugToUse}
            postType={targetPostType}
            options={postTypes}
            onPostTypeChange={handlePostTypeChange}
            renderLayout={renderLayout}
          />
        );
      }
      return (
        <GenericArchiveView
          slug={slugToUse}
          postType={targetPostType}
          options={postTypes}
          isLoading={isLoading}
          permalinkSettings={permalinkSettings}
          onPostTypeChange={handlePostTypeChange}
          onCreate={handleCreate}
          renderLayout={renderLayout}
        />
      );
    },
    [
      handleCreate,
      handlePostTypeChange,
      hydratedPostType,
      isLoading,
      permalinkSettings,
      postTypes,
      resolvedSlug,
    ],
  );

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
      <AdminLayoutContent className="flex flex-1">
        {/* <AdminLayoutHeader /> */}
        <AdminLayoutMain className="flex flex-1 flex-col">
          {/* <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
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
            </div> */}

          <Card className="flex flex-1 flex-col border-none p-0 shadow-none">
            {/* <CardHeader>
                <CardTitle>{pluginSetting.label}</CardTitle>
                {pluginSetting.description ? (
                  <CardDescription>{pluginSetting.description}</CardDescription>
                ) : null}
              </CardHeader> */}
            <CardContent className="flex flex-1 flex-col p-0">
              {pluginSettingContent ?? (
                <p className="text-muted-foreground text-sm">
                  This plugin does not expose configurable settings yet.
                </p>
              )}
            </CardContent>
          </Card>
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
    const singleView = (
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
    return pluginSingleView
      ? wrapWithPluginProviders(singleView, pluginSingleView.pluginId)
      : singleView;
  }

  if (
    !pluginArchiveView &&
    (resolvedSlug === "attachment" || resolvedSlug === "attachments")
  ) {
    return (
      <AttachmentsArchiveView
        slug={resolvedSlug}
        postType={hydratedPostType}
        options={postTypes}
        onPostTypeChange={handlePostTypeChange}
      />
    );
  }

  if (pluginArchiveView && archiveTabs.length > 0) {
    const activeArchiveDefinition =
      archiveTabs.find((tab) => tab.slug === activeArchiveTab) ??
      archiveTabs[0];
    const showDefaultArchive =
      activeArchiveDefinition?.usesDefaultArchive ?? false;
    const archiveSlug = activeArchiveDefinition?.postTypeSlug ?? resolvedSlug;
    const archivePostType =
      postTypes.find((type) => type.slug === archiveSlug) ?? hydratedPostType;
    const pluginTabProps = {
      pluginId: pluginArchiveView.pluginId,
      pluginName: pluginArchiveView.pluginName,
      postTypeSlug: archiveSlug,
      organizationId,
    };
    const archiveContent = showDefaultArchive ? (
      renderGenericArchive(false, archiveSlug)
    ) : activeArchiveDefinition?.render ? (
      activeArchiveDefinition.render(pluginTabProps)
    ) : (
      <PlaceholderState label={activeArchiveDefinition?.label ?? ""} />
    );
    const layoutTabs = archiveTabs.map((tab) => ({
      value: tab.slug,
      label: tab.label,
      onClick: () => handleArchiveTabChange(tab.slug),
    }));
    const archiveLayout = (
      <AdminLayout
        title={`${archivePostType?.name ?? archiveSlug} Archive`}
        description={
          archivePostType?.description ??
          "Manage structured entries for this post type."
        }
        activeTab={activeArchiveTab}
        pathname={`/admin/edit?post_type=${archiveSlug}`}
      >
        <AdminLayoutContent withSidebar={false}>
          <AdminLayoutMain>
            <AdminLayoutHeader customTabs={layoutTabs} />
            <div className="container py-6">{archiveContent}</div>
          </AdminLayoutMain>
        </AdminLayoutContent>
      </AdminLayout>
    );
    return wrapWithPluginProviders(archiveLayout, pluginArchiveView.pluginId);
  }

  return renderGenericArchive(true);
}

export default function AdminEditPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading editor…</div>}>
      <AdminEditPageBody />
    </Suspense>
  );
}
