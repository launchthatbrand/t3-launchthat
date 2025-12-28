"use client";

import type { Doc } from "@/convex/_generated/dataModel";

import type { MenuItemInput, MenuSectionRef } from "~/lib/adminMenu";
import { adminMenuRegistry } from "~/lib/adminMenu";

interface TaxonomyDefinition {
  slug: string;
  name: string;
}

type PostTypeDoc = Doc<"postTypes">;

const getSectionForPostType = (
  postType: PostTypeDoc,
): MenuSectionRef | undefined => {
  const parent = postType.adminMenu?.parent?.toLowerCase();
  const slug = postType.adminMenu?.slug?.toLowerCase();

  const match = (value: string | undefined, target: string) =>
    value ? value.startsWith(target) || value === target : false;

  if (match(parent, "lms") || match(slug, "lms")) {
    return { id: "lms", label: "LMS", order: 20 };
  }
  if (match(parent, "crm") || match(slug, "crm")) {
    return { id: "crm", label: "CRM", order: 25 };
  }
  if (match(parent, "shop") || match(slug, "shop") || match(slug, "store")) {
    return { id: "shop", label: "Shop", order: 30 };
  }
  if (match(parent, "support") || match(slug, "support")) {
    return { id: "support", label: "Support", order: 40 };
  }
  if (match(parent, "calendar") || match(slug, "calendar")) {
    return { id: "calendar", label: "Campaign Calendar", order: 45 };
  }
  if (match(parent, "social") || match(slug, "social")) {
    return { id: "social", label: "Social Hub", order: 50 };
  }
  if (match(parent, "tasks") || match(slug, "tasks")) {
    return { id: "tasks", label: "Tasks", order: 55 };
  }

  return undefined;
};

const hasCustomAdminPath = (slug?: string) => {
  if (!slug) return false;
  if (slug.startsWith("http")) return true;
  if (!slug.includes("/")) return false;
  const tail = slug.split("/").filter(Boolean).pop() ?? "";
  return tail.length !== slug.length;
};

const registerPostTypeMenus = () => {
  adminMenuRegistry.registerSource("postTypes", (context) => {
    const postTypes = (context.postTypes as PostTypeDoc[] | undefined) ?? [];
    const taxonomyAssignments =
      (context.taxonomyAssignments as
        | Map<string, TaxonomyDefinition[]>
        | undefined) ?? new Map<string, TaxonomyDefinition[]>();
    const pluginParents =
      (context.pluginParents as
        | Record<
            string,
            {
              parentId?: string;
              customPath?: string;
              mode?: "inline" | "group";
            }
          >
        | undefined) ?? {};
    const pluginPostTypeOwners = context.pluginPostTypeOwners ?? {};

    const items: MenuItemInput[] = [];

    postTypes
      .filter((type) => type.adminMenu?.enabled)
      .sort((a, b) => {
        const posA = a.adminMenu?.position ?? 100;
        const posB = b.adminMenu?.position ?? 100;
        return posA - posB;
      })
      .forEach((postType) => {
        const slug = postType.slug;
        const owningPluginId = pluginPostTypeOwners[slug];
        if (owningPluginId && context.isPluginEnabled) {
          if (!context.isPluginEnabled(owningPluginId)) {
            return;
          }
        }
        const section = getSectionForPostType(postType);
        const adminSlug = postType.adminMenu?.slug?.trim();
        const pluginMeta = pluginParents[slug];
        const pluginControlsNav = Boolean(pluginMeta);
        let customPath: string | undefined;

        if (pluginControlsNav) {
          if (
            pluginMeta?.customPath &&
            hasCustomAdminPath(pluginMeta.customPath)
          ) {
            customPath = pluginMeta.customPath;
          }
        } else if (hasCustomAdminPath(adminSlug)) {
          customPath = adminSlug;
        }

        const menuId = `postType:${slug}`;
        // Ignore `plugin:*` parent declarations on post types.
        // We want plugin grouping/inline behavior to be controlled centrally by
        // `pluginParents` (which is enablement-aware).
        const pluginParentId = pluginMeta?.parentId;

        const href = customPath
          ? customPath.startsWith("http")
            ? customPath
            : `/admin/${customPath.replace(/^\/+/, "")}`
          : `/admin/edit?post_type=${encodeURIComponent(slug)}`;

        const baseItem: MenuItemInput = {
          id: menuId,
          label: postType.adminMenu?.label ?? postType.name,
          href,
          icon: postType.adminMenu?.icon,
          order: postType.adminMenu?.position ?? 100,
        };

        if (pluginParentId) {
          baseItem.parentId = pluginParentId;
        } else if (pluginMeta?.mode === "inline") {
          // Inline plugin post types should land in the default sidebar list
          // (no plugin group, no special section heuristics).
        } else if (section) {
          baseItem.section = section;
        }

        items.push(baseItem);

        const taxonomies = taxonomyAssignments.get(slug) ?? [];
        taxonomies.forEach((taxonomy, index) => {
          items.push({
            id: `${menuId}:taxonomy:${taxonomy.slug}`,
            label:
              taxonomy.slug === "category"
                ? "Categories"
                : taxonomy.slug === "post_tag"
                  ? "Tags"
                  : taxonomy.name,
            href: `/admin/edit?taxonomy=${taxonomy.slug}&post_type=${encodeURIComponent(
              slug,
            )}`,
            parentId: menuId,
            order: 200 + index,
          });
        });

        if (slug === "attachments") {
          items.push({
            id: `${menuId}:settings`,
            label: "Settings",
            href: "/admin/media/settings",
            parentId: menuId,
            order: 300,
          });
        }
      });

    return items;
  });
};

registerPostTypeMenus();
