/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import "~/lib/adminMenu/sources/postTypes";
import "../_components/nav-items";

import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { BookOpen } from "lucide-react";

import { NavMain } from "@acme/ui/general/nav-main";
import { Sidebar, SidebarContent, SidebarHeader } from "@acme/ui/sidebar";

import type { MenuNode } from "~/lib/adminMenu/registry";
import { AdminTeamSwitcher } from "~/components/admin/AdminTeamSwitcher";
import { useAdminMenuSections } from "~/lib/adminMenu/useAdminMenuSections";

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

const iconLibrary = LucideIcons as unknown as Record<
  string,
  LucideIcon | undefined
>;

export default function DefaultSidebar() {
  const { sections: appliedSections } = useAdminMenuSections();

  const resolveIcon = useCallback((iconName?: string) => {
    if (!iconName) {
      return BookOpen;
    }
    const Icon = iconLibrary[iconName];
    if (!Icon) {
      return BookOpen;
    }
    return Icon as typeof BookOpen;
  }, []);

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
    <Sidebar collapsible="icon" className="overflow-hidden">
      <SidebarHeader>
        <AdminTeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navSections} />
      </SidebarContent>
    </Sidebar>
  );
}
