"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  MailIcon,
  MoveLeftIcon,
  PlusCircleIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";
import { cn } from "../lib/utils";
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
} from "../sidebar";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedSectionLabel, setFocusedSectionLabel] = useState<string | null>(
    null,
  );

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

  const visibleSections =
    focusedSectionLabel != null
      ? normalizedSections.filter(
          (section) => section.label === focusedSectionLabel,
        )
      : normalizedSections;

  if (normalizedSections.length === 0) {
    return null;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollContainer =
      container.closest<HTMLElement>("[data-sidebar='content']") ?? container;

    const target =
      scrollContainer.querySelector<HTMLElement>("[data-nav-exact='true']") ??
      scrollContainer.querySelector<HTMLElement>("[data-nav-active='true']");

    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [pathname]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const scrollContainer =
      container.closest<HTMLElement>("[data-sidebar='content']") ?? container;

    const storageKey = "admin-sidebar-scroll";
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        scrollContainer.scrollTop = parsed;
      }
    }

    const handleScroll = () => {
      window.sessionStorage.setItem(
        storageKey,
        String(scrollContainer.scrollTop),
      );
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
                    data-nav-active={isCurrentActive ? "true" : undefined}
                    data-nav-exact={itemActive ? "true" : undefined}
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
                                "bg-accent/50 text-accent-foreground font-medium",
                            )}
                            data-nav-active={subItemActive ? "true" : undefined}
                            data-nav-exact={subItemActive ? "true" : undefined}
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
              data-nav-active={itemActive ? "true" : undefined}
              data-nav-exact={itemActive ? "true" : undefined}
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
      <SidebarGroupContent
        ref={containerRef}
        className="flex flex-col gap-4 overflow-y-auto"
      >
        {focusedSectionLabel && (
          <button
            type="button"
            onClick={() => setFocusedSectionLabel(null)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
          >
            <MoveLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        )}

        {visibleSections.map((section, index) => {
          if (!section.label) {
            return (
              <div key={`section-${index}`} className="flex flex-col gap-2">
                {renderMenuItems(section.items)}
              </div>
            );
          }

          const isSectionActive = sectionIsActive(section);

          const label = section.label!; // safe because of the earlier guard

          const handleFocusSection = () => {
            if (focusedSectionLabel === label) {
              setFocusedSectionLabel(null);
              return;
            }
            setFocusedSectionLabel(label);
          };

          return (
            <div
              key={section.label}
              className="group/collapsible flex flex-col gap-2"
            >
              {renderMenuItems(section.items)}
            </div>
          );
        })}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
