"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { cn } from "@acme/ui";

const tabClass =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

export const OrganizationTabs = () => {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const pathname = usePathname();

  const base = `/platform/organization/${encodeURIComponent(organizationId)}`;
  const guildRoutePrefix = `${base}/connections/discord/guilds/`;
  const isGuildRoute = pathname.startsWith(guildRoutePrefix);
  const guildId = isGuildRoute ? pathname.slice(guildRoutePrefix.length).split("/")[0] : "";
  const tabs = [
    { label: "General", href: base },
    { label: "Members", href: `${base}/members` },
    { label: "Domains", href: `${base}/domains` },
    { label: "Connections", href: `${base}/connections` },
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
    <div className="border-border/60 bg-muted/10 inline-flex gap-1 rounded-lg border p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              tabClass,
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
};

