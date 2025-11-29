"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as LucideIcons from "lucide-react";

import { cn } from "@acme/ui";

interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

interface AdminNavProps {
  items: NavItem[];
}

export function AdminNav({ items }: AdminNavProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Function to get icon component from string name
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;

    // Using type assertion to handle the dynamic icon lookup
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as
      | LucideIcon
      | undefined;

    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  };

  return (
    <nav className="bg-background h-full border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <span className="text-primary">Admin Portal</span>
        </Link>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isOpen = openMenus[item.title] ?? isActive;

          // Render parent item
          return (
            <div key={item.href} className="flex flex-col">
              {item.children ? (
                // Parent with children (collapsible)
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(item.icon)}
                    {item.title}
                  </div>
                  <span
                    className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                  >
                    →
                  </span>
                </button>
              ) : (
                // Standard link item
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {getIcon(item.icon)}
                  {item.title}
                </Link>
              )}

              {/* Render child items if menu is open */}
              {item.children && isOpen && (
                <div className="mt-1 ml-4 flex flex-col gap-1 border-l pl-2">
                  {item.children.map((child) => {
                    const isChildActive =
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                          isChildActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted",
                        )}
                      >
                        {getIcon(child.icon)}
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
