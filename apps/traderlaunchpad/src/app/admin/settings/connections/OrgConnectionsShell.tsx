"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plug } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { cn } from "~/lib/utils";

import { useTenant } from "~/context/TenantContext";

interface Props {
  children: React.ReactNode;
}

export function OrgConnectionsShell(props: Props) {
  const tenant = useTenant();
  const pathname = usePathname();
  const baseHref = pathname.startsWith("/admin/connections")
    ? "/admin/connections"
    : "/admin/settings/connections";
  const orgName = tenant?.name ?? "Organization";

  const items = [
    {
      id: "discord",
      title: "Discord",
      description: "Guild connections, templates, routing, and member links.",
      href: `${baseHref}/discord`,
    },
    {
      id: "telegram",
      title: "Telegram",
      description: "Channel integrations (coming soon).",
      href: `${baseHref}/telegram`,
      disabled: true,
    },
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/80">Connections</div>
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
          >
            <Plug className="mr-1 h-3.5 w-3.5" />
            Org
          </Badge>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-semibold text-white/90">{orgName}</div>
          <div className="mt-1 text-xs text-white/55">
            Org-level integrations like Discord and Telegram.
          </div>
        </div>

        <div className="space-y-2">
          {items.map((it) => {
            const isActive =
              pathname === it.href || pathname.startsWith(`${it.href}/`);
            return (
              <div
                key={it.id}
                className={cn(
                  "rounded-xl border border-white/10 bg-black/20 p-4 transition",
                  isActive && "border-white/20 bg-black/30",
                  it.disabled && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/90">
                      {it.title}
                    </div>
                    <div className="mt-1 text-xs text-white/55">
                      {it.description}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {it.disabled ? (
                      <Button variant="outline" className="h-8 px-3 text-xs" disabled>
                        Coming soon
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="h-8 px-3 text-xs">
                        <Link href={it.href}>Manage</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="min-w-0">{props.children}</section>
    </div>
  );
}

