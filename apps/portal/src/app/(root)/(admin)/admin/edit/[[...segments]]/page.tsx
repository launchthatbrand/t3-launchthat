/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import "@/lib/plugins/vimeo/configureClient";

import {
  ADMIN_PLUGIN_SETTINGS_HEADER_AFTER,
  ADMIN_PLUGIN_SETTINGS_HEADER_BEFORE,
} from "~/lib/plugins/hookSlots";
import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
  AdminLayoutSidebar,
} from "~/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  DefaultArchiveSidebar,
  GenericArchiveView,
} from "../_components/GenericArchiveView";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultPermalinkSettings,
  isPermalinkSettingsValue,
} from "../_components/permalink";
import {
  getPluginArchiveViewForSlug,
  getPluginSingleViewForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import { useRouter, useSearchParams } from "next/navigation";

import { AdminSinglePostView } from "../_components/AdminSinglePostView";
import { AttachmentsArchiveView } from "../_components/AttachmentsArchiveView";
import { Button } from "@acme/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import type { PermalinkSettings } from "../_components/permalink";
import { PlaceholderState } from "../_components/PlaceholderState";
import type { PluginMenuItem } from "../_components/GenericArchiveView";
import type { ReactNode } from "react";
import { TaxonomyTermsView } from "../_components/TaxonomyTermsView";
import { api } from "@/convex/_generated/api";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { useAdminMenuSections } from "~/lib/adminMenu/useAdminMenuSections";
import { useAdminPostContext } from "../../_providers/AdminPostProvider";
import { useApplyFilters } from "~/lib/hooks/react";
import { useQuery } from "convex/react";
import { useTenant } from "~/context/TenantContext";

const DEFAULT_POST_TYPE = "course";
const PERMALINK_OPTION_KEY = "permalink_settings";

type PostTypeDoc = Doc<"postTypes">;

function AdminEditPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const { sections: adminMenuSections, postTypes } = useAdminMenuSections();
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
  const pluginMenus = useMemo<Record<string, PluginMenuItem[]>>(() => {
    const map: Record<string, PluginMenuItem[]> = {};
    adminMenuSections.forEach((section) => {
      if (!section.id) {
        return;
      }
      const pluginId = section.id;
      const pluginRoot = section.items.find(
        (node) => node.id === `plugin:${pluginId}`,
      );
      const children = pluginRoot?.children ?? section.items;
      if (children.length === 0) {
        return;
      }
      map[pluginId] = children.map((child) => ({
        id: child.id,
        label: child.label,
        href: child.href,
      }));
    });
    return map;
  }, [adminMenuSections]);
  const pluginSettingsHookContext = useMemo(() => {
    if (!pluginDefinition || !pluginSetting) {
      return undefined;
    }
    return {
      pluginId: pluginDefinition.id,
      plugin: pluginDefinition,
      pageSlug: pluginSetting.slug,
      pluginMenus,
    };
  }, [pluginDefinition, pluginSetting, pluginMenus]);
  const pluginSettingsHeaderBefore = useApplyFilters<ReactNode[]>(
    ADMIN_PLUGIN_SETTINGS_HEADER_BEFORE,
    [],
    pluginSettingsHookContext,
  );
  const pluginSettingsHeaderAfter = useApplyFilters<ReactNode[]>(
    ADMIN_PLUGIN_SETTINGS_HEADER_AFTER,
    [],
    pluginSettingsHookContext,
  );
  const renderPluginSettingsHeaderContent = useCallback(
    (items: ReactNode[] | undefined, slot: "before" | "after") => {
      if (!items?.length) {
        return null;
      }
      return (
        <div
          className="space-y-2"
          data-hook-slot={`admin.plugin.settings.header.${slot}`}
        >
          {items.map((node, index) => (
            <div key={`plugin-settings-header-${slot}-${index}`}>{node}</div>
          ))}
        </div>
      );
    },
    [],
  );
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
    return getPluginArchiveViewForSlug(resolvedSlug);
  }, [resolvedSlug]);

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
      pluginArchiveView.config.tabs?.[0]?.slug ??
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

  interface RenderArchiveOptions {
    withSidebar?: boolean;
  }

  const renderGenericArchive = useCallback(
    (
      renderLayout: boolean,
      targetSlug?: string,
      options?: RenderArchiveOptions,
    ) => {
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
          withSidebar={options?.withSidebar ?? true}
          pluginMenus={pluginMenus}
          organizationId={organizationId ?? undefined}
        />
      );
    },
    [
      handleCreate,
      handlePostTypeChange,
      hydratedPostType,
      isLoading,
      permalinkSettings,
      pluginMenus,
      postTypes,
      resolvedSlug,
      organizationId,
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
        <AdminLayoutMain className="flex flex-1 flex-col space-y-6">
          {renderPluginSettingsHeaderContent(
            pluginSettingsHeaderBefore,
            "before",
          )}
          <Card className="flex flex-1 flex-col border-none p-0 shadow-none">
            <CardContent className="flex flex-1 flex-col p-0">
              {pluginSettingContent ?? (
                <p className="text-muted-foreground text-sm">
                  This plugin does not expose configurable settings yet.
                </p>
              )}
            </CardContent>
          </Card>
          {renderPluginSettingsHeaderContent(
            pluginSettingsHeaderAfter,
            "after",
          )}
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

  const rawSidebarPreference =
    pluginArchiveView &&
    typeof pluginArchiveView.config?.showSidebar === "boolean"
      ? (pluginArchiveView.config.showSidebar as boolean)
      : undefined;
  const normalizedSidebarPreference = rawSidebarPreference;

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
    const showPluginSidebar = normalizedSidebarPreference ?? true;
    const archiveLayout = (
      <PluginArchiveLayout
        archiveSlug={archiveSlug}
        archivePostType={archivePostType}
        activeArchiveTab={activeArchiveTab}
        layoutTabs={layoutTabs}
        archiveContent={archiveContent}
        showDefaultArchive={showDefaultArchive}
        showSidebar={showPluginSidebar}
      />
    );
    return wrapWithPluginProviders(archiveLayout, pluginArchiveView.pluginId);
  }

  return renderGenericArchive(true, undefined, {
    withSidebar: normalizedSidebarPreference ?? true,
  });
}

interface ArchiveTabConfig {
  value: string;
  label: string;
  onClick: () => void;
}

interface PluginArchiveLayoutProps {
  archiveSlug: string;
  archivePostType: PostTypeDoc | null;
  activeArchiveTab: string;
  layoutTabs: ArchiveTabConfig[];
  archiveContent: ReactNode;
  showDefaultArchive: boolean;
  showSidebar: boolean;
}

const PluginArchiveLayout: React.FC<PluginArchiveLayoutProps> = ({
  archiveSlug,
  archivePostType,
  activeArchiveTab,
  layoutTabs,
  archiveContent,
  showDefaultArchive,
  showSidebar,
}) => {
  const archiveHookContext = useMemo(
    () => ({
      postType: archiveSlug,
      postTypeDefinition: archivePostType,
      layout: "plugin" as const,
    }),
    [archivePostType, archiveSlug],
  );

  const headerBefore = useApplyFilters<ReactNode[]>(
    "admin.archive.header.before",
    [],
    archiveHookContext,
  );
  const headerAfter = useApplyFilters<ReactNode[]>(
    "admin.archive.header.after",
    [],
    archiveHookContext,
  );

  const renderInjectedHeaderContent = useCallback(
    (items: ReactNode[], slot: "before" | "after") => {
      if (items.length === 0) {
        return null;
      }
      return (
        <div
          className="space-y-2 pt-4"
          data-hook-slot={`admin.archive.header.${slot}`}
        >
          {items.map((node, index) => (
            <div key={`plugin-archive-header-${slot}-${index}`}>{node}</div>
          ))}
        </div>
      );
    },
    [],
  );

  const headerBeforeContent = renderInjectedHeaderContent(
    headerBefore,
    "before",
  );
  const headerAfterContent = renderInjectedHeaderContent(headerAfter, "after");

  return (
    <AdminLayout
      title={`${archivePostType?.name ?? archiveSlug} Archive`}
      description={
        archivePostType?.description ??
        "Manage structured entries for this post type."
      }
      activeTab={activeArchiveTab}
      pathname={`/admin/edit?post_type=${archiveSlug}`}
    >
      <AdminLayoutContent withSidebar={showSidebar}>
        <AdminLayoutMain>
          {showDefaultArchive ? headerBeforeContent : null}
          <AdminLayoutHeader customTabs={layoutTabs} />
          {showDefaultArchive ? headerAfterContent : null}
          <div className="container py-6">{archiveContent}</div>
        </AdminLayoutMain>
        {showSidebar ? (
          <AdminLayoutSidebar className="border-l p-4">
            <DefaultArchiveSidebar />
          </AdminLayoutSidebar>
        ) : null}
      </AdminLayoutContent>
    </AdminLayout>
  );
};

export default function AdminEditPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading editor…</div>}>
      <AdminEditPageBody />
    </Suspense>
  );
}
