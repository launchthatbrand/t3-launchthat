"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  MailIcon,
  MoveLeftIcon,
  PlusCircleIcon,
} from "lucide-react";

import { Button, cn } from "@acme/ui";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@acme/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@acme/ui/sidebar";

import { QuickCreateDialog } from "./quick-create-dialog";

interface SubItem {
  title: string;
  url: string;
  items?: {
    title: string;
    url: string;
  }[];
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: SubItem[];
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

interface NavMainProps {
  items?: NavItem[];
  sections?: NavSection[];
}

export function NavMain({ items, sections }: NavMainProps) {
  const pathname = usePathname();

  // Check if a given path is active
  const isActive = (url: string) => {
    // Exact match for dashboard or root paths
    if (url === "/dashboard" || url === "/") {
      return pathname === url;
    }

    // For other paths, check if the current path starts with the URL
    // This ensures that sub-pages also activate their parent menu item
    return pathname.startsWith(url);
  };

  // Check if any sub-item is active
  const hasActiveChild = (itemUrl: string, subItems?: SubItem[]) => {
    if (!subItems) return false;

    // If the parent URL is active, return true
    if (isActive(itemUrl)) return true;

    // Check if any child URL is active
    return subItems.some((subItem) => isActive(subItem.url));
  };

  const normalizedSections: NavSection[] =
    sections && sections.length > 0
      ? sections
      : items && items.length > 0
        ? [{ items }]
        : [];

  if (normalizedSections.length === 0) {
    return null;
  }

  const renderMenuItems = (menuItems: NavItem[]) => (
    <SidebarMenu>
      {menuItems.map((item) => {
        const itemActive = isActive(item.url);
        const childActive = hasActiveChild(item.url, item.items);
        const isCurrentActive = itemActive || childActive;

        if (item.items && item.items.length > 0) {
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isCurrentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={isCurrentActive}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.url}
                      className="flex flex-1 items-center gap-2 [&>svg]:size-4 [&>svg]:shrink-0"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const subItemActive = isActive(subItem.url);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              subItemActive &&
                                "bg-accent/50 font-medium text-accent-foreground",
                            )}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              className={cn(itemActive && "bg-accent text-accent-foreground")}
            >
              <Link href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  const sectionIsActive = (section: NavSection) =>
    section.items.some((item) => {
      if (isActive(item.url)) return true;
      return item.items?.some((sub) => isActive(sub.url));
    });

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-4">
        {normalizedSections.map((section, index) => {
          if (!section.label) {
            return (
              <div key={`section-${index}`} className="flex flex-col gap-2">
                {renderMenuItems(section.items)}
              </div>
            );
          }

          const isSectionActive = sectionIsActive(section);

          return (
            <Collapsible
              key={section.label}
              defaultOpen={isSectionActive}
              className="group/collapsible flex flex-col gap-2"
            >
              <SidebarGroupLabel
                asChild
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger className="flex items-center px-2 py-1">
                  {section.label}
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                {renderMenuItems(section.items)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
