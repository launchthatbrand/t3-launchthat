import {
  ArrowLeftRightIcon,
  ClipboardListIcon,
  DatabaseIcon,
  HistoryIcon,
  RefreshCwIcon,
  Settings2Icon,
} from "lucide-react";

import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface NavLink {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const navLinks: NavLink[] = [
  {
    title: "Integration Settings",
    href: "/monday",
    icon: <Settings2Icon className="h-5 w-5" />,
    description: "Configure Monday.com connection settings",
  },
  {
    title: "Board Mappings",
    href: "/monday/mappings",
    icon: <DatabaseIcon className="h-5 w-5" />,
    description: "Map Monday.com boards to Convex tables",
  },
  {
    title: "Sync Control",
    href: "/monday/sync",
    icon: <RefreshCwIcon className="h-5 w-5" />,
    description: "Control data synchronization",
  },
  {
    title: "Field Mappings",
    href: "/monday/fields",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    description: "Map Monday.com columns to Convex fields",
  },
  {
    title: "Parent-Child Relations",
    href: "/monday/relations",
    icon: <ArrowLeftRightIcon className="h-5 w-5" />,
    description: "Configure parent-child relationships",
  },
  {
    title: "Sync Logs",
    href: "/monday/sync-logs",
    icon: <HistoryIcon className="h-5 w-5" />,
    description: "View synchronization logs and metrics",
  },
];

export function MondayNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navLinks.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
            pathname === link.href
              ? "bg-primary font-medium text-primary-foreground"
              : "hover:bg-muted",
          )}
        >
          <span className="mr-3">{link.icon}</span>
          <span>{link.title}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MondayNavigationCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {navLinks.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          className="block rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex items-center">
            <div className="mr-3 text-primary">{link.icon}</div>
            <h3 className="font-medium">{link.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{link.description}</p>
        </Link>
      ))}
    </div>
  );
}
