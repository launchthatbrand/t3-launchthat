"use client";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import { cn } from "@acme/ui";
import { usePathname } from "next/navigation";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode; // Optional icon
  extraIcon?: React.ReactNode; // Optional extra icon (e.g. for external links)
}

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => (
        <Button
          key={item.href}
          asChild // Render the Button as the Link component
          variant="ghost"
          className={cn(
            "w-full justify-start",
            pathname === item.href
              ? "bg-muted hover:bg-muted" // Active link style
              : "hover:bg-transparent hover:underline", // Inactive link style
          )}
        >
          <Link href={item.href}>
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span className="flex items-center">
              {item.title}
              {item.extraIcon && item.extraIcon}
            </span>
          </Link>
        </Button>
      ))}
    </>
  );
}
