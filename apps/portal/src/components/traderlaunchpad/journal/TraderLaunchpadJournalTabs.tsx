"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@acme/ui";

type PrivateTabKey = "dashboard" | "orders" | "ideas" | "settings" | "leaderboard";
type PublicTabKey = "dashboard" | "orders" | "ideas" | "leaderboard";

type BaseTab = {
  key: string;
  label: string;
  href: string;
  /**
   * Additional pathnames that should count as "active" for this tab.
   * Useful for legacy aliases like `/journal` meaning dashboard.
   */
  activeAliases?: string[];
};

function getIsActive(pathname: string, tab: BaseTab): boolean {
  if (pathname === tab.href) return true;
  if (pathname.startsWith(`${tab.href}/`)) return true;
  if (tab.activeAliases?.some((p) => p === pathname)) return true;
  return false;
}

function tabTriggerClassName(isActive: boolean): string {
  return cn(
    "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    isActive &&
      "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
  );
}

export function TraderLaunchpadJournalTabs(props:
  | { variant: "private" }
  | { variant: "public"; username: string }
) {
  const pathname = usePathname();

  const tabs: BaseTab[] =
    props.variant === "public"
      ? ([
          {
            key: "dashboard" satisfies PublicTabKey,
            label: "Dashboard",
            href: `/journal/u/${props.username}/dashboard`,
            activeAliases: [`/journal/u/${props.username}`],
          },
          {
            key: "orders" satisfies PublicTabKey,
            label: "Orders",
            href: `/journal/u/${props.username}/orders`,
          },
          {
            key: "ideas" satisfies PublicTabKey,
            label: "Trade Ideas",
            href: `/journal/u/${props.username}/ideas`,
          },
          {
            key: "leaderboard" satisfies PublicTabKey,
            label: "Leaderboard",
            href: "/journal/leaderboard",
          },
        ] as const)
      : ([
          {
            key: "dashboard" satisfies PrivateTabKey,
            label: "Dashboard",
            href: "/journal/dashboard",
            activeAliases: ["/journal"],
          },
          {
            key: "orders" satisfies PrivateTabKey,
            label: "Orders",
            href: "/journal/orders",
          },
          {
            key: "ideas" satisfies PrivateTabKey,
            label: "Trade Ideas",
            href: "/journal/ideas",
          },
          {
            key: "settings" satisfies PrivateTabKey,
            label: "Settings",
            href: "/journal/settings",
          },
          {
            key: "leaderboard" satisfies PrivateTabKey,
            label: "Leaderboard",
            href: "/journal/leaderboard",
          },
        ] as const);

  return (
    <nav aria-label="Journal navigation">
      <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
        {tabs.map((t) => {
          const isActive = getIsActive(pathname, t);
          return (
            <Link
              key={t.key}
              href={t.href}
              className={tabTriggerClassName(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


