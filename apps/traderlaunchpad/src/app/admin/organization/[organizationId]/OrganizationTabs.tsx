"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

export function OrganizationTabs(props: { organizationId: string }) {
  const pathname = usePathname();
  const base = `/admin/organization/${encodeURIComponent(props.organizationId)}`;
  const guildRoutePrefix = `${base}/connections/discord/guilds/`;
  const isGuildRoute = pathname.startsWith(guildRoutePrefix);
  const guildId = isGuildRoute ? pathname.slice(guildRoutePrefix.length).split("/")[0] : "";
  const tabs: { href: string; label: string }[] = [
    { href: base, label: "General" },
    { href: `${base}/members`, label: "Members" },
    { href: `${base}/connections`, label: "Connections" },
  ];

  if (isGuildRoute) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href={`${base}/connections`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Back to Connections
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Discord</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium truncate">
          {guildId ? `Guild ${guildId}` : "Guild"}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              isActive &&
                "bg-background dark:text-foreground dark:border-input dark:bg-input/30 shadow-sm",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

