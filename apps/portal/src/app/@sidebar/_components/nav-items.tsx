import type React from "react";
import {
  BookOpen,
  HammerIcon,
  Settings2,
  Share2,
  TerminalSquare,
  Users,
} from "lucide-react";

import type { MenuItemInput } from "~/lib/adminMenu";
import { adminMenuRegistry } from "~/lib/adminMenu";

interface CoreNavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  items?: CoreNavItem[];
}

export const navItems: CoreNavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: TerminalSquare,
    isActive: true,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/admin/settings/site",
      },
      {
        title: "Post types",
        url: "/admin/settings/post-types",
      },
      {
        title: "Custom fields",
        url: "/admin/settings/post-types?tab=fields",
      },
      {
        title: "Taxonomies",
        url: "/admin/settings/post-types?tab=taxonomies",
      },
      {
        title: "Templates",
        url: "/admin/settings/templates",
      },
      {
        title: "Menus",
        url: "/admin/settings/menus",
      },
      {
        title: "Roles",
        url: "/admin/settings/roles",
      },
      {
        title: "Organizations",
        url: "/admin/settings/organizations",
      },
      {
        title: "Domains",
        url: "/admin/settings/domains",
      },
      {
        title: "Permalinks",
        url: "/admin/settings/permalinks",
      },
      {
        title: "Page Templates",
        url: "/admin/settings/page-templates",
      },
      {
        title: "Notifications",
        url: "/admin/settings/notifications",
      },
      {
        title: "Emails",
        url: "/admin/settings/emails",
      },
      {
        title: "Logs",
        url: "/admin/logs",
      },
    ],
  },
  { title: "Tools", url: "/admin/tools", icon: HammerIcon },
  {
    title: "Plugins",
    url: "/admin/plugins",
    icon: BookOpen,
  },
  {
    title: "Integrations",
    url: "/admin/integrations",
    icon: Share2,
    items: [
      {
        title: "Apps",
        url: "/admin/integrations",
      },
      {
        title: "Connections",
        url: "/admin/integrations?tab=connections",
      },
      {
        title: "Scenarios",
        url: "/admin/integrations?tab=scenarios",
      },
      {
        title: "Logs",
        url: "/admin/integrations/logs",
      },
    ],
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildCoreNavMenuItems = (
  items: CoreNavItem[],
  parentId?: string,
  parentOrder = 0,
) => {
  const results: MenuItemInput[] = [];

  items.forEach((item, index) => {
    const baseId = parentId
      ? `${parentId}:${slugify(item.title)}`
      : `core:${slugify(item.title)}`;
    const iconComponent = item.icon as
      | (React.ComponentType & { displayName?: string })
      | undefined;
    const iconName = iconComponent?.displayName ?? undefined;

    results.push({
      id: baseId,
      label: item.title,
      href: item.url,
      icon: iconName,
      order: parentOrder + index,
      parentId,
    });

    if (Array.isArray(item.items) && item.items.length > 0) {
      results.push(
        ...buildCoreNavMenuItems(item.items, baseId, parentOrder + index),
      );
    }
  });

  return results;
};

adminMenuRegistry.registerSource("core:nav", () =>
  buildCoreNavMenuItems(navItems),
);
