import type React from "react";
import {
  BookOpen,
  HammerIcon,
  HelpCircle,
  Settings2,
  Share2,
  TerminalSquare,
  Twitter,
  User,
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
    url: "/dashboard",
    icon: TerminalSquare,
    isActive: true,
  },
  // {
  //   title: "LMS",
  //   url: "/admin/lms",
  //   icon: Users,
  //   items: [
  //     {
  //       title: "Courses",
  //       url: "/admin/lms/courses",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Lessons",
  //       url: "/admin/lms/lessons",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Topics",
  //       url: "/admin/lms/topics",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Quizzes",
  //       url: "/admin/lms/quizzes",
  //       icon: BookOpen,
  //     },
  //   ],
  // },

  // {
  //   title: "Shop",
  //   url: "/admin/store",
  //   icon: User,
  //   items: [
  //     {
  //       title: "Dashboard",
  //       url: "/admin/store",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Orders",
  //       url: "/admin/store/orders",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Products",
  //       url: "/admin/store/products",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Funnels",
  //       url: "/admin/store/funnels",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Categories",
  //       url: "/admin/store/products/categories",
  //       icon: BookOpen,
  //     },

  //     {
  //       title: "Tags",
  //       url: "/admin/store/products/tags",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Chargebacks",
  //       url: "/admin/store/chargebacks",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Balances",
  //       url: "/admin/store/balances",
  //       icon: BookOpen,
  //     },
  //     {
  //       title: "Settings",
  //       url: "/admin/store/settings",
  //       icon: BookOpen,
  //     },
  //   ],
  // },
  // {
  //   title: "Helpdesk",
  //   url: "/admin/helpdesk",
  //   icon: HelpCircle,
  //   items: [
  //     {
  //       title: "Tickets",
  //       url: "/admin/helpdesk/tickets",
  //       icon: BookOpen,
  //     },
  //   ],
  // },
  // {
  //   title: "Social",
  //   url: "/social/feed",
  //   icon: Twitter,
  //   items: [
  //     {
  //       title: "Feed",
  //       url: "#",
  //     },
  //     {
  //       title: "Team",
  //       url: "#",
  //     },
  //     {
  //       title: "Billing",
  //       url: "#",
  //     },
  //     {
  //       title: "Limits",
  //       url: "#",
  //     },
  //   ],
  // },
  // {
  //   title: "Tasks",
  //   url: "/admin/tasks",
  //   icon: BookOpen,
  // },
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
