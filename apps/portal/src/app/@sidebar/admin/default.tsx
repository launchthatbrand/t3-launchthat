/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import * as LucideIcons from "lucide-react";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";
import { useCallback, useMemo } from "react";

import { AdminTeamSwitcher } from "~/components/admin/AdminTeamSwitcher";
import { BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavMain } from "@acme/ui/general/nav-main";
import type { PluginDefinition } from "~/lib/plugins/types";
import { api } from "@/convex/_generated/api";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { navItems } from "../_components/nav-items";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
import { useQuery } from "convex/react";
import { useTaxonomies } from "~/app/(root)/(admin)/admin/settings/taxonomies/_api/taxonomies";
import { useTenant } from "~/context/TenantContext";

type PostTypeDoc = Doc<"postTypes">;

interface NavChildItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavChildItem[];
}

type GroupedNavItem = NavItem & {
  group?:
    | "lms"
    | "postTypes"
    | "shop"
    | "calendar"
    | "support"
    | "social"
    | "tasks"
    | "crm";
  position?: number;
  postTypeSlug?: string;
};

interface TaxonomyNavDefinition {
  slug: string;
  name: string;
  postTypeSlugs?: string[];
}

const canAccessPostType = (
  postType: PostTypeDoc,
  organizationId: Id<"organizations">,
) => {
  const enabledIds = postType.enabledOrganizationIds;
  if (enabledIds !== undefined) {
    if (enabledIds.length === 0) {
      if (postType.isBuiltIn && postType.organizationId === undefined) {
        return true;
      }
      return false;
    }
    return enabledIds.includes(organizationId);
  }

  if (postType.organizationId) {
    return postType.organizationId === organizationId;
  }

  return true;
};

const BUILTIN_TAXONOMIES: TaxonomyNavDefinition[] = [
  {
    slug: "category",
    name: "Categories",
    postTypeSlugs: ["posts"],
  },
  {
    slug: "post_tag",
    name: "Tags",
    postTypeSlugs: ["posts"],
  },
] as const;

export default function DefaultSidebar() {
  const tenant = useTenant();
  const tenantId = tenant?._id;
  const organizationId = getTenantOrganizationId(tenant);
  const postTypesQuery = usePostTypes(true);
  const taxonomiesQuery = useTaxonomies();
  const scopedOptionsOrgId = organizationId ?? tenantId;
  const pluginOptions = useQuery(
    api.core.options.getByType,
    scopedOptionsOrgId ? { orgId: scopedOptionsOrgId, type: "site" } : "skip",
  );
  const contentTypes = useMemo<PostTypeDoc[]>(() => {
    if (!Array.isArray(postTypesQuery.data)) {
      return [];
    }
    const types = postTypesQuery.data as PostTypeDoc[];
    return tenantId
      ? types.filter((type) => canAccessPostType(type, tenantId))
      : types;
  }, [postTypesQuery.data, tenantId]);
  const taxonomyDefs = useMemo<
    { slug: string; name: string; postTypeSlugs?: string[] }[]
  >(() => {
    if (!Array.isArray(taxonomiesQuery.data)) {
      return [];
    }
    return taxonomiesQuery.data as {
      slug: string;
      name: string;
      postTypeSlugs?: string[];
    }[];
  }, [taxonomiesQuery.data]);

  const resolveIcon = useCallback((iconName?: string) => {
    if (!iconName) return BookOpen;
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    if (!Icon) {
      return BookOpen;
    }
    return Icon as typeof BookOpen;
  }, []);

  const normalizedTaxonomies = useMemo<TaxonomyNavDefinition[]>(() => {
    const list: TaxonomyNavDefinition[] = taxonomyDefs.map((taxonomy) => ({
      slug: taxonomy.slug,
      name: taxonomy.name,
      postTypeSlugs: taxonomy.postTypeSlugs,
    }));

    BUILTIN_TAXONOMIES.forEach((fallback) => {
      if (!list.some((entry) => entry.slug === fallback.slug)) {
        list.push({
          slug: fallback.slug,
          name: fallback.name,
          postTypeSlugs: fallback.postTypeSlugs,
        });
      }
    });

    return list;
  }, [taxonomyDefs]);

  const pluginOptionMap = useMemo(() => {
    if (!Array.isArray(pluginOptions)) {
      return new Map<string, boolean>();
    }
    return new Map(
      pluginOptions.map((option) => [
        option.metaKey as string,
        Boolean(option.metaValue),
      ]),
    );
  }, [pluginOptions]);

  const isPluginEnabled = useCallback(
    (plugin: PluginDefinition) => {
      const hasAllPostTypes =
        plugin.postTypes.length === 0 ||
        plugin.postTypes.every((definition) =>
          contentTypes.some((type) => type.slug === definition.slug),
        );
      if (!hasAllPostTypes) {
        return false;
      }
      if (!plugin.activation) {
        return true;
      }
      const stored = pluginOptionMap.get(plugin.activation.optionKey);
      if (stored === undefined) {
        return plugin.activation.defaultEnabled ?? false;
      }
      return stored;
    },
    [contentTypes, pluginOptionMap],
  );

  const taxonomyAssignments = useMemo(() => {
    const map = new Map<string, TaxonomyNavDefinition[]>();
    const allPostTypeSlugs = contentTypes.map((type) => type.slug);

    normalizedTaxonomies.forEach((taxonomy) => {
      const targets =
        taxonomy.postTypeSlugs && taxonomy.postTypeSlugs.length > 0
          ? taxonomy.postTypeSlugs
          : allPostTypeSlugs;
      targets.forEach((slug) => {
        if (!map.has(slug)) {
          map.set(slug, []);
        }
        map.get(slug)?.push(taxonomy);
      });
    });

    contentTypes.forEach((type) => {
      if (!type.supports?.taxonomy) return;
      const current = map.get(type.slug) ?? [];
      const missingBuiltins = BUILTIN_TAXONOMIES.filter((fallback) =>
        current.every((assigned) => assigned.slug !== fallback.slug),
      );
      if (missingBuiltins.length > 0) {
        map.set(type.slug, [...current, ...missingBuiltins]);
      } else if (!map.has(type.slug) && current.length === 0) {
        map.set(type.slug, BUILTIN_TAXONOMIES.slice());
      }
    });

    return map;
  }, [normalizedTaxonomies, contentTypes]);

  const baseDynamicItems: GroupedNavItem[] = contentTypes
    .filter((type: PostTypeDoc) => type.adminMenu?.enabled)
    .sort((a: PostTypeDoc, b: PostTypeDoc) => {
      const aPos = a.adminMenu?.position ?? 100;
      const bPos = b.adminMenu?.position ?? 100;
      return aPos - bPos;
    })
    .map((type: PostTypeDoc) => {
      const IconComponent = resolveIcon(type.adminMenu?.icon);
      const adminSlug = type.adminMenu?.slug?.trim();
      const normalizedAdminSlug = adminSlug ?? "";
      const slugMatchesPath =
        normalizedAdminSlug.includes("/") &&
        normalizedAdminSlug.split("/").filter(Boolean).pop()?.toLowerCase() ===
          type.slug.toLowerCase();
      const hasCustomPath =
        normalizedAdminSlug.length > 0 &&
        (normalizedAdminSlug.startsWith("http") ||
          (normalizedAdminSlug.includes("/") && !slugMatchesPath));
      const url = hasCustomPath
        ? normalizedAdminSlug.startsWith("http")
          ? normalizedAdminSlug
          : `/admin/${normalizedAdminSlug.replace(/^\/+/, "")}`
        : `/admin/edit?post_type=${encodeURIComponent(type.slug)}`;

      const assignedTaxonomies = taxonomyAssignments.get(type.slug) ?? [];
      const childItems =
        assignedTaxonomies.length > 0
          ? assignedTaxonomies.map((taxonomy) => ({
              title:
                taxonomy.slug === "category"
                  ? "Categories"
                  : taxonomy.slug === "post_tag"
                    ? "Tags"
                    : taxonomy.name,
              url: `/admin/edit?taxonomy=${taxonomy.slug}&post_type=${encodeURIComponent(
                type.slug,
              )}`,
            }))
          : undefined;

      const parentGroup = type.adminMenu?.parent?.toLowerCase();
      const slugLower = adminSlug?.toLowerCase();
      let group: GroupedNavItem["group"] = "postTypes";
      if (
        parentGroup === "lms" ||
        slugLower?.startsWith("lms") ||
        slugLower === "lms"
      ) {
        group = "lms";
      } else if (
        parentGroup === "shop" ||
        slugLower?.startsWith("store") ||
        slugLower === "shop"
      ) {
        group = "shop";
      } else if (
        parentGroup === "helpdesk" ||
        parentGroup === "support" ||
        slugLower?.startsWith("helpdesk") ||
        slugLower?.startsWith("support") ||
        slugLower === "helpdesk" ||
        slugLower === "support"
      ) {
        group = "support";
      } else if (
        parentGroup === "calendar" ||
        slugLower?.startsWith("calendar") ||
        slugLower === "calendar"
      ) {
        group = "calendar";
      } else if (parentGroup === "social" || slugLower?.startsWith("social")) {
        group = "social";
      } else if (parentGroup === "tasks" || slugLower?.startsWith("tasks")) {
        group = "tasks";
      }

      let combinedItems = childItems;
      if (type.slug === "attachments") {
        const mediaSettingsChild: NavChildItem = {
          title: "Settings",
          url: "/admin/media/settings",
        };
        combinedItems = [...(combinedItems ?? []), mediaSettingsChild];
      }

      return {
        title: type.adminMenu?.label ?? type.name,
        url,
        icon: IconComponent,
        items: combinedItems,
        group,
        postTypeSlug: type.slug,
      };
    });

  const pluginSettingsMenus = useMemo<
    { pluginId: string; item: NavItem }[]
  >(() => {
    if (contentTypes.length === 0) {
      return [];
    }

    const settingsIcon = LucideIcons.Settings ?? BookOpen;

    return pluginDefinitions
      .filter(
        (plugin) =>
          plugin.settingsPages &&
          plugin.settingsPages.length > 0 &&
          isPluginEnabled(plugin),
      )
      .map((plugin) => {
        const firstSetting = plugin.settingsPages?.[0];
        const buildSettingsUrl = (slug: string) =>
          `/admin/edit?plugin=${plugin.id}&page=${slug}`;
        const baseUrl = firstSetting
          ? buildSettingsUrl(firstSetting.slug)
          : `/admin/integrations/plugins/${plugin.id}`;

        return {
          pluginId: plugin.id,
          item: {
            title: `${plugin.name} Settings`,
            url: baseUrl,
            icon: settingsIcon,
            items: plugin.settingsPages?.map((setting) => ({
              title: setting.label,
              url: buildSettingsUrl(setting.slug),
            })),
          },
        };
      });
  }, [contentTypes, isPluginEnabled]);

  const { pluginStandaloneNavItems, pluginChildNavItems } = useMemo<{
    pluginStandaloneNavItems: GroupedNavItem[];
    pluginChildNavItems: { parentSlug: string; item: NavChildItem }[];
  }>(() => {
    const standalone: GroupedNavItem[] = [];
    const children: { parentSlug: string; item: NavChildItem }[] = [];

    pluginDefinitions
      .filter((plugin) => plugin.adminMenus && isPluginEnabled(plugin))
      .forEach((plugin) => {
        (plugin.adminMenus ?? []).forEach((menu) => {
          const IconComponent = resolveIcon(menu.icon);
          const url = menu.slug.startsWith("http")
            ? menu.slug
            : `/admin/${menu.slug.replace(/^\/+/, "")}`;

          if (menu.parentPostTypeSlug) {
            children.push({
              parentSlug: menu.parentPostTypeSlug,
              item: {
                title: menu.label,
                url,
              },
            });
            return;
          }

          const group =
            (menu.group?.toLowerCase() as GroupedNavItem["group"]) ?? "support";
          standalone.push({
            title: menu.label,
            url,
            icon: IconComponent,
            group,
            position: menu.position ?? 100,
          });
        });
      });

    standalone.sort((a, b) => (a.position ?? 100) - (b.position ?? 100));

    return {
      pluginStandaloneNavItems: standalone,
      pluginChildNavItems: children,
    };
  }, [isPluginEnabled, resolveIcon]);

  const dynamicItems = useMemo<GroupedNavItem[]>(() => {
    if (pluginChildNavItems.length === 0) {
      return baseDynamicItems;
    }
    return baseDynamicItems.map((item) => {
      if (!item.postTypeSlug) return item;
      const matches = pluginChildNavItems.filter(
        (child) => child.parentSlug === item.postTypeSlug,
      );
      if (matches.length === 0) {
        return item;
      }
      return {
        ...item,
        items: [...(item.items ?? []), ...matches.map((child) => child.item)],
      };
    });
  }, [baseDynamicItems, pluginChildNavItems]);

  const typedNavItems = navItems as NavItem[];
  const [dashboardItem, ...staticNavItems] = typedNavItems;
  const adminNavTitles = new Set([
    "Users",
    "Tools",
    "Integrations",
    "Plugins",
    "Settings",
  ]);
  const adminNavItems = staticNavItems.filter((item) =>
    adminNavTitles.has(item.title),
  );
  const remainingStaticItems = staticNavItems.filter(
    (item) => !adminNavTitles.has(item.title),
  );

  const sections: { label?: string; items: NavItem[] }[] = [];

  if (dashboardItem) {
    sections.push({ items: [dashboardItem] });
  }

  const lmsItems = [
    ...dynamicItems.filter((item) => item.group === "lms"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "lms"),
  ];
  const crmItems = [
    ...dynamicItems.filter((item) => item.group === "crm"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "crm"),
  ];
  const shopItems = [
    ...dynamicItems.filter((item) => item.group === "shop"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "shop"),
  ];
  const calendarItems = [
    ...dynamicItems.filter((item) => item.group === "calendar"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "calendar"),
  ];
  const socialItems = [
    ...dynamicItems.filter((item) => item.group === "social"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "social"),
  ];
  const tasksItems = [
    ...dynamicItems.filter((item) => item.group === "tasks"),
    ...pluginStandaloneNavItems.filter((item) => item.group === "tasks"),
  ];
  const postTypeItems = dynamicItems.filter(
    (item) =>
      item.group !== "lms" &&
      item.group !== "crm" &&
      item.group !== "shop" &&
      item.group !== "support" &&
      item.group !== "calendar" &&
      item.group !== "social" &&
      item.group !== "tasks",
  );
  const supportSectionItems = useMemo(() => {
    const supportPlugin = pluginDefinitions.find(
      (plugin) => plugin.id === "support",
    );
    if (!supportPlugin || !isPluginEnabled(supportPlugin)) {
      return [];
    }
    return [
      {
        title: "Dashboard",
        url: "/admin/support",
        icon: resolveIcon("LayoutDashboard"),
      },
      {
        title: "Helpdesk Articles",
        url: "/admin/edit?post_type=helpdeskarticles",
        icon: resolveIcon("BookOpen"),
      },
      {
        title: "Canned Responses",
        url: "/admin/support/responses",
        icon: resolveIcon("NotebookPen"),
      },
      {
        title: "Conversations",
        url: "/admin/support/conversations",
        icon: resolveIcon("MessageSquare"),
      },
      {
        title: "Settings",
        url: "/admin/support/settings",
        icon: resolveIcon("Settings"),
      },
    ];
  }, [isPluginEnabled]);
  const lmsSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "lms")
    .map((entry) => entry.item);
  const shopSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "commerce")
    .map((entry) => entry.item);
  const calendarSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "calendar")
    .map((entry) => entry.item);

  if (postTypeItems.length > 0 || lmsItems.length > 0) {
    sections.push({ label: "Post Types", items: postTypeItems });
    if (lmsItems.length > 0 || lmsSettingsItems.length > 0) {
      sections.push({
        label: "LMS",
        items: [...lmsItems, ...lmsSettingsItems],
      });
    }
    if (crmItems.length > 0) {
      sections.push({
        label: "CRM",
        items: crmItems,
      });
    }
  }

  if (shopItems.length > 0 || shopSettingsItems.length > 0) {
    sections.push({
      label: "Shop",
      items: [...shopItems, ...shopSettingsItems],
    });
  }

  if (calendarItems.length > 0 || calendarSettingsItems.length > 0) {
    sections.push({
      label: "Campaign Calendar",
      items: [...calendarItems, ...calendarSettingsItems],
    });
  }

  if (tasksItems.length > 0) {
    sections.push({
      label: "Tasks",
      items: tasksItems,
    });
  }

  if (socialItems.length > 0) {
    sections.push({
      label: "Social Hub",
      items: socialItems,
    });
  }

  if (supportSectionItems.length > 0) {
    sections.push({
      label: "Support",
      items: supportSectionItems,
    });
  }

  if (adminNavItems.length > 0) {
    sections.push({ label: "Admin", items: adminNavItems });
  }

  if (remainingStaticItems.length > 0) {
    sections.push({ items: remainingStaticItems });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden"
      // {...props}
    >
      <SidebarHeader>
        <AdminTeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={sections} />
      </SidebarContent>
    </Sidebar>
  );
}
