/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import "~/lib/adminMenu/sources/postTypes";
import "../_components/nav-items";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import * as LucideIcons from "lucide-react";
import { BookOpen } from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";

import type { AdminMenuOverrides } from "~/lib/adminMenu/overrides";
import type { MenuNode } from "~/lib/adminMenu/registry";
import type { PluginDefinition } from "~/lib/plugins/types";
import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
import { useTaxonomies } from "~/app/(root)/(admin)/admin/settings/taxonomies/_api/taxonomies";
import { AdminTeamSwitcher } from "~/components/admin/AdminTeamSwitcher";
import { useTenant } from "~/context/TenantContext";
import { ADMIN_MENU_OPTION_KEY, adminMenuRegistry } from "~/lib/adminMenu";
import { applyAdminMenuOverrides } from "~/lib/adminMenu/overrides";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

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
  const adminMenuOverridesDoc = useQuery(
    api.core.options.get,
    scopedOptionsOrgId
      ? {
          orgId: scopedOptionsOrgId,
          type: "site",
          metaKey: ADMIN_MENU_OPTION_KEY,
        }
      : "skip",
  );
  const adminMenuOverrides = adminMenuOverridesDoc?.metaValue as
    | AdminMenuOverrides
    | undefined;
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

  const convertChildren = useCallback(
    (children: MenuNode[]): NavChildItem[] =>
      children.map((child) => ({
        title: child.label,
        url: child.href,
      })),
    [],
  );

  const convertNodeToNavItem = useCallback(
    (node: MenuNode): NavItem => ({
      title: node.label,
      url: node.href,
      icon: resolveIcon(node.icon),
      items:
        node.children.length > 0 ? convertChildren(node.children) : undefined,
    }),
    [convertChildren, resolveIcon],
  );

  const isPluginDefinition = (
    value: PluginDefinition | Record<string, never> | null | undefined,
  ): value is PluginDefinition => {
    return Boolean(value && "id" in value);
  };

  const registrySections = useMemo(() => {
    const pluginEnabledLookup: (pluginId: string) => boolean = (pluginId) => {
      const plugin = pluginDefinitions.find(
        (definition) => definition?.id === pluginId,
      );
      if (!isPluginDefinition(plugin)) {
        return true;
      }
      return Boolean(isPluginEnabled(plugin));
    };
    const pluginParentMap = pluginDefinitions.reduce<
      Record<string, { parentId: string; customPath?: string }>
    >((acc, plugin) => {
      if (!plugin.settingsPages?.length) {
        return acc;
      }
      if (!isPluginDefinition(plugin)) {
        return acc;
      }
      if (!isPluginEnabled(plugin)) {
        return acc;
      }
      plugin.postTypes.forEach((definition) => {
        acc[definition.slug] = {
          parentId: `plugin:${plugin.id}`,
          customPath: definition.adminMenu?.slug,
        };
      });
      return acc;
    }, {});
    return adminMenuRegistry.getMenuSections({
      postTypes: contentTypes,
      taxonomyAssignments,
      isPluginEnabled: pluginEnabledLookup,
      pluginParents: pluginParentMap,
    });
  }, [contentTypes, taxonomyAssignments, isPluginEnabled]);

  const appliedSections = useMemo(
    () => applyAdminMenuOverrides(registrySections, adminMenuOverrides),
    [registrySections, adminMenuOverrides],
  );

  const navSections = useMemo(
    () =>
      appliedSections
        .map((section) => ({
          label: section.label,
          items: section.items.map((node) => convertNodeToNavItem(node)),
        }))
        .filter((section) => section.items.length > 0),
    [appliedSections, convertNodeToNavItem],
  );

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
        <NavMain sections={navSections} />
      </SidebarContent>
    </Sidebar>
  );
}
