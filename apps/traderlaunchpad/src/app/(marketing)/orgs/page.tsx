"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { AffiliatePageShell } from "~/components/affiliates/AffiliatePageShell";
import { api } from "@convex-config/_generated/api";

interface PublicOrgRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
}

const buildOrgUrl = (slug: string): string => {
  if (typeof window === "undefined") return `/${encodeURIComponent(slug)}`;

  const host = window.location.host; // includes port
  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port;
  const proto = window.location.protocol;

  // Local dev: localhost:3000 → slug.localhost:3000
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1")
  ) {
    const base = hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
    return `${proto}//${encodeURIComponent(slug)}.${base}${port ? `:${port}` : ""}/`;
  }

  // Production: www.traderlaunchpad.com → slug.traderlaunchpad.com
  const root = host.replace(/^www\./i, "");
  return `${proto}//${encodeURIComponent(slug)}.${root}/`;
};

export default function OrgsArchivePage() {
  const rows = useQuery(api.coreTenant.organizations.listOrganizationsPublic, {
    limit: 500,
  }) as PublicOrgRow[] | undefined;

  const orgs = Array.isArray(rows) ? rows : [];

  return (
    <AffiliatePageShell
      title="Organizations"
      subtitle="Explore trader communities using TraderLaunchpad."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <Link
            key={org._id}
            href={buildOrgUrl(org.slug)}
            className="group overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md transition-colors hover:bg-white/6"
          >
            <div className="p-5">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={org.logoUrl ?? ""}
                  alt={org.name}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-black/30 object-cover"
                />
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-white">{org.name}</div>
                  <div className="truncate text-xs text-white/50">{org.slug}</div>
                </div>
              </div>

              {org.description ? (
                <div className="mt-3 line-clamp-3 text-sm text-white/70">
                  {org.description}
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/40">No description yet.</div>
              )}

              <div className="mt-4 text-xs font-medium text-orange-200/80">
                View org →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="h-24" />
    </AffiliatePageShell>
  );
}

