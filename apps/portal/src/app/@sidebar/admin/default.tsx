/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import * as LucideIcons from "lucide-react";

import type { Doc, Id } from "@/convex/_generated/dataModel";

import { AdminTeamSwitcher } from "~/components/admin/AdminTeamSwitcher";
import { BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavMain } from "@acme/ui/general/nav-main";
import type { PluginDefinition } from "~/lib/plugins/types";
import { SidebarHeader } from "@acme/ui/sidebar";
import { navItems } from "../_components/nav-items";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { useMemo } from "react";
import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
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
  group?: "lms" | "postTypes" | "shop" | "helpdesk" | "calendar";
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
  const postTypesQuery = usePostTypes(true);
  const taxonomiesQuery = useTaxonomies();
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

  const resolveIcon = (iconName?: string) => {
    if (!iconName) return BookOpen;
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    if (!Icon) {
      return BookOpen;
    }
    return Icon as typeof BookOpen;
  };

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

  const dynamicItems: GroupedNavItem[] = contentTypes
    .filter((type: PostTypeDoc) => type.adminMenu?.enabled)
    .sort((a: PostTypeDoc, b: PostTypeDoc) => {
      const aPos = a.adminMenu?.position ?? 100;
      const bPos = b.adminMenu?.position ?? 100;
      return aPos - bPos;
    })
    .map((type: PostTypeDoc) => {
      const IconComponent = resolveIcon(type.adminMenu?.icon);
      const adminSlug = type.adminMenu?.slug?.trim();
      const slugMatchesPath =
        adminSlug &&
        adminSlug.includes("/") &&
        adminSlug.split("/").filter(Boolean).pop()?.toLowerCase() ===
          type.slug.toLowerCase();
      const hasCustomPath =
        adminSlug &&
        (adminSlug.startsWith("http") ||
          (adminSlug.includes("/") && !slugMatchesPath));
      const url = hasCustomPath
        ? adminSlug.startsWith("http")
          ? adminSlug
          : `/admin/${adminSlug.replace(/^\/+/, "")}`
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
        slugLower?.startsWith("helpdesk") ||
        slugLower === "helpdesk"
      ) {
        group = "helpdesk";
      } else if (
        parentGroup === "calendar" ||
        slugLower?.startsWith("calendar") ||
        slugLower === "calendar"
      ) {
        group = "calendar";
      }

      return {
        title: type.adminMenu?.label ?? type.name,
        url,
        icon: IconComponent,
        items: childItems,
        group,
      };
    });

  const pluginSettingsMenus = useMemo<
    { pluginId: string; item: NavItem }[]
  >(() => {
    if (contentTypes.length === 0) {
      return [];
    }

    const settingsIcon = LucideIcons.Settings ?? BookOpen;

    const isPluginEnabled = (plugin: PluginDefinition) =>
      plugin.postTypes.every((definition) =>
        contentTypes.some((type) => type.slug === definition.slug),
      );

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
  }, [contentTypes]);

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

  const lmsItems = dynamicItems.filter((item) => item.group === "lms");
  const shopItems = dynamicItems.filter((item) => item.group === "shop");
  const helpdeskItems = dynamicItems.filter(
    (item) => item.group === "helpdesk",
  );
  const calendarItems = dynamicItems.filter(
    (item) => item.group === "calendar",
  );
  const postTypeItems = dynamicItems.filter(
    (item) => item.group !== "lms" && item.group !== "shop",
  );
  const lmsSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "lms")
    .map((entry) => entry.item);
  const shopSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "commerce")
    .map((entry) => entry.item);
  const helpdeskSettingsItems = pluginSettingsMenus
    .filter((entry) => entry.pluginId === "helpdesk")
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

  if (helpdeskItems.length > 0 || helpdeskSettingsItems.length > 0) {
    sections.push({
      label: "Helpdesk",
      items: [...helpdeskItems, ...helpdeskSettingsItems],
    });
  }

  if (adminNavItems.length > 0) {
    sections.push({ label: "Admin", items: adminNavItems });
  }

  if (remainingStaticItems.length > 0) {
    sections.push({ items: remainingStaticItems });
  }

  return (
    <>
      <SidebarHeader>
        <AdminTeamSwitcher />
      </SidebarHeader>
      <NavMain sections={sections} />
    </>
  );
}
