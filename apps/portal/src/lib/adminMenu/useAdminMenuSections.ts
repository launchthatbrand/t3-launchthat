"use client";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import type { AdminMenuOverrides } from "./overrides";
import type { MenuSectionNode } from "./registry";
import type { PluginDefinition } from "~/lib/plugins/types";
import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
import { useTaxonomies } from "~/app/(root)/(admin)/admin/settings/taxonomies/_api/taxonomies";
import { useTenant } from "~/context/TenantContext";
import { pluginDefinitions } from "~/lib/plugins/definitions";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { ADMIN_MENU_OPTION_KEY, applyAdminMenuOverrides } from "./overrides";
import { adminMenuRegistry } from "./registry";

type PostTypeDoc = Doc<"postTypes">;
type TaxonomyDoc = Doc<"taxonomies">;

const BUILTIN_TAXONOMIES: readonly (Pick<TaxonomyDoc, "slug" | "name"> & {
  postTypeSlugs?: string[];
})[] = [
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
];

const canAccessPostType = (
  postType: PostTypeDoc,
  organizationId?: Id<"organizations">,
) => {
  if (!organizationId) {
    return true;
  }

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

export interface UseAdminMenuSectionsResult {
  sections: MenuSectionNode[];
  registrySections: MenuSectionNode[];
  postTypes: PostTypeDoc[];
  isLoading: boolean;
}

export const useAdminMenuSections = (): UseAdminMenuSectionsResult => {
  const tenant = useTenant();
  const tenantId = tenant?._id;
  const organizationId = getTenantOrganizationId(tenant);
  const postTypesQuery = usePostTypes(true);
  const taxonomiesQuery = useTaxonomies();
  const scopedOptionsOrgId = organizationId ?? tenantId;
  const pluginOptions = useQuery(
    api.core.options.getByType,
    scopedOptionsOrgId
      ? ({ orgId: scopedOptionsOrgId, type: "site" } as const)
      : "skip",
  ) as Doc<"options">[] | undefined;
  const adminMenuOverridesDoc = useQuery(
    api.core.options.get,
    scopedOptionsOrgId
      ? ({
          orgId: scopedOptionsOrgId,
          type: "site",
          metaKey: ADMIN_MENU_OPTION_KEY,
        } as const)
      : "skip",
  ) as Doc<"options"> | undefined;
  const adminMenuOverrides = adminMenuOverridesDoc?.metaValue as
    | AdminMenuOverrides
    | undefined;

  const contentTypes = useMemo<PostTypeDoc[]>(() => {
    if (!Array.isArray(postTypesQuery.data)) {
      return [];
    }
    const types = postTypesQuery.data;
    return tenantId
      ? types.filter((type) => canAccessPostType(type, tenantId))
      : types;
  }, [postTypesQuery.data, tenantId]);

  const taxonomyDefs = useMemo<TaxonomyDoc[]>(() => {
    if (!Array.isArray(taxonomiesQuery.data)) {
      return [];
    }
    return taxonomiesQuery.data;
  }, [taxonomiesQuery.data]);

  const normalizedTaxonomies = useMemo(() => {
    const list = taxonomyDefs.map((taxonomy) => ({
      slug: taxonomy.slug,
      name: taxonomy.name,
      postTypeSlugs: taxonomy.postTypeSlugs,
    }));

    BUILTIN_TAXONOMIES.forEach((fallback) => {
      if (!list.some((entry) => entry.slug === fallback.slug)) {
        list.push({
          slug: fallback.slug,
          name: fallback.name,
          postTypeSlugs: fallback.postTypeSlugs ?? ["posts"],
        });
      }
    });

    return list;
  }, [taxonomyDefs]);

  const taxonomyAssignments = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; name: string; postTypeSlugs?: string[] }[]
    >();
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

  const pluginOptionMap = useMemo(() => {
    if (!Array.isArray(pluginOptions)) {
      return new Map<string, boolean>();
    }
    return new Map(
      pluginOptions.map((option) => [
        option.metaKey,
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

  const pluginEnabledLookup = useCallback(
    (pluginId: string) => {
      const plugin = pluginDefinitions.find(
        (definition) => definition.id === pluginId,
      );
      if (!plugin) {
        return true;
      }
      return isPluginEnabled(plugin);
    },
    [isPluginEnabled],
  );

  const pluginParents = useMemo<
    Record<string, { parentId: string; customPath?: string }>
  >(() => {
    return pluginDefinitions.reduce<
      Record<string, { parentId: string; customPath?: string }>
    >((acc, plugin) => {
      if (!isPluginEnabled(plugin)) {
        return acc;
      }
      // Only parent post types under `plugin:<id>` when that plugin contributes a
      // root menu entry (today: via `settingsPages`). Otherwise, we orphan the
      // post type item and it disappears from the sidebar.
      if (!plugin.settingsPages?.length) {
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
  }, [isPluginEnabled]);

  const registrySections = useMemo(
    () =>
      adminMenuRegistry.getMenuSections({
        postTypes: contentTypes,
        taxonomyAssignments,
        isPluginEnabled: pluginEnabledLookup,
        pluginParents,
      }),
    [contentTypes, pluginEnabledLookup, pluginParents, taxonomyAssignments],
  );

  const appliedSections = useMemo(
    () => applyAdminMenuOverrides(registrySections, adminMenuOverrides),
    [registrySections, adminMenuOverrides],
  );

  return {
    sections: appliedSections,
    registrySections,
    postTypes: contentTypes,
    isLoading: postTypesQuery.isLoading || taxonomiesQuery.isLoading,
  };
};
