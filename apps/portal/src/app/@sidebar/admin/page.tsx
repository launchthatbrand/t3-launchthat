"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { BookOpen } from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { SidebarHeader } from "@acme/ui/sidebar";

import { usePostTypes } from "~/app/(root)/(admin)/admin/settings/post-types/_api/postTypes";
import { useTaxonomies } from "~/app/(root)/(admin)/admin/settings/taxonomies/_api/taxonomies";
import { navItems } from "../_components/nav-items";

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
  const { data: contentTypes } = usePostTypes(true);
  const { data: taxonomyDefs } = useTaxonomies();

  const resolveIcon = (iconName?: string) => {
    if (!iconName) return BookOpen;
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
    return (Icon as typeof BookOpen) ?? BookOpen;
  };

  const normalizedTaxonomies = useMemo<TaxonomyNavDefinition[]>(() => {
    const list: TaxonomyNavDefinition[] =
      (taxonomyDefs ?? []).map((taxonomy) => ({
        slug: taxonomy.slug,
        name: taxonomy.name,
        postTypeSlugs: taxonomy.postTypeSlugs ?? undefined,
      })) ?? [];

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
    const typedPostTypes = (contentTypes as PostTypeDoc[] | undefined) ?? [];
    const allPostTypeSlugs = typedPostTypes.map((type) => type.slug);

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

    typedPostTypes.forEach((type) => {
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

  const dynamicItems =
    (contentTypes as PostTypeDoc[] | undefined)
      ?.filter((type: PostTypeDoc) => type.adminMenu?.enabled)
      .sort((a: PostTypeDoc, b: PostTypeDoc) => {
        const aPos = a.adminMenu?.position ?? 100;
        const bPos = b.adminMenu?.position ?? 100;
        return aPos - bPos;
      })
      .map((type: PostTypeDoc) => {
        const IconComponent = resolveIcon(type.adminMenu?.icon);
        const adminSlug = type.adminMenu?.slug?.trim();
        const hasCustomPath =
          adminSlug &&
          (adminSlug.includes("/") || adminSlug.startsWith("http"));
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

        return {
          title: type.adminMenu?.label ?? type.name,
          url,
          icon: IconComponent,
          items: childItems,
        };
      }) ?? [];

  const [dashboardItem, ...staticNavItems] = navItems as NavItem[];
  const orderedItems: Array<NavItem | undefined> = [
    dashboardItem,
    ...dynamicItems,
    ...staticNavItems,
  ];
  const items: NavItem[] = orderedItems.filter((item): item is NavItem =>
    Boolean(item),
  );

  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={items} />
    </>
  );
}
