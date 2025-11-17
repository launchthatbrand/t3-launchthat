"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { BookOpen, TerminalSquare } from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { TeamSwitcher } from "@acme/ui/general/team-switcher";
import { SidebarHeader } from "@acme/ui/sidebar";

const MENU_LOCATION = "primary";

const FALLBACK_NAV = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: TerminalSquare,
  },
] as const;

type MenuItemDoc = Doc<"menuItems">;

interface SidebarNavItem {
  title: string;
  url: string;
  icon?: typeof BookOpen;
  isActive?: boolean;
  items?: SidebarNavItem[];
}

const normalizeUrl = (url: string) => {
  if (!url) return "/";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

const getOrderValue = (value: number | null | undefined) =>
  typeof value === "number" ? value : 0;

const buildMenuTree = (
  items: MenuItemDoc[],
  pathname: string | null,
  parentId: Id<"menuItems"> | null = null,
): SidebarNavItem[] => {
  return items
    .filter((item) => {
      if (item.parentId === undefined || item.parentId === null) {
        return parentId === null;
      }
      return item.parentId === parentId;
    })
    .sort((a, b) => getOrderValue(a.order) - getOrderValue(b.order))
    .map((item) => {
      const url = normalizeUrl(item.url);
      const isActive =
        pathname !== null &&
        (pathname === url || pathname.startsWith(`${url}/`));
      return {
        title: item.label,
        url,
        icon: BookOpen,
        isActive,
        items: buildMenuTree(items, pathname, item._id),
      };
    });
};

export default function DefaultSidebar() {
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const menuData = useQuery(api.core.menus.queries.getMenuWithItemsByLocation, {
    location: MENU_LOCATION,
  }) as
    | {
        menu: Doc<"menus">;
        items: MenuItemDoc[];
      }
    | null
    | undefined;

  console.log("menuData", menuData);

  const navItems = useMemo(() => {
    if (!menuData || menuData.items.length === 0) {
      return FALLBACK_NAV;
    }
    const tree = buildMenuTree(menuData.items, pathname);
    return tree.length ? tree : FALLBACK_NAV;
  }, [menuData, pathname]);

  return (
    <>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <NavMain items={navItems} />
    </>
  );
}
