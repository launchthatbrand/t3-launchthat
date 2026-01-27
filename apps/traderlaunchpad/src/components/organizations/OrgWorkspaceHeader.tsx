"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { useTenant } from "~/context/TenantContext";
import { cn } from "~/lib/utils";

const SHOULD_SHOW_ON = new Set<string>([
  "/admin",
  "/admin/dashboard",
  "/admin/journal",
  "/admin/tradeideas",
  "/admin/strategies",
]);

export function OrgWorkspaceHeader(props: { className?: string }) {
  const tenant = useTenant();
  const pathname = usePathname();

  // Only render on org subdomains (not platform/global).
  if (!tenant || tenant.slug === "platform") return null;

  // Only render on the requested admin routes.
  if (!SHOULD_SHOW_ON.has(pathname)) return null;

  const org = useQuery(api.coreTenant.organizations.getOrganizationById, {
    organizationId: tenant._id,
  }) as
    | { _id: string; name: string; description?: string; logoUrl: string | null }
    | null
    | undefined;

  const title = org?.name ?? tenant.name ?? tenant.slug;
  const description = org?.description ?? null;
  const logoUrl = org?.logoUrl ?? null;

  return (
    <div
      className={cn(
        "border-b border-white/10 bg-black/30 backdrop-blur-md",
        props.className,
      )}
    >
      <div className="container py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={title}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs font-semibold text-white/80">
                {(title || "O").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs font-medium text-white/60">Organization</div>
            <div className="truncate text-sm font-semibold text-white">{title}</div>
            {description ? (
              <div className="truncate text-xs text-white/50">{description}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

