"use client";

import { AffiliatePageShell } from "~/components/affiliates/AffiliatePageShell";
import { ArrowLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

interface OrgSlugRow {
  _id: string;
  name: string;
  slug: string;
}

interface OrgDetailRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
}

export default function PublicOrgProfilePage() {
  const params = useParams<{ slug?: string | string[] }>();
  const raw = params.slug;
  const slug = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const orgBySlug = useQuery(
    api.coreTenant.organizations.getOrganizationBySlug,
    slug ? { slug } : "skip",
  ) as OrgSlugRow | null | undefined;

  const orgId = orgBySlug?._id ?? "";

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    orgId ? { organizationId: orgId } : "skip",
  ) as OrgDetailRow | null | undefined;

  const title = org?.name ?? orgBySlug?.name ?? slug;
  const description = org?.description ?? null;
  const logoUrl = org?.logoUrl ?? null;

  return (
    <div className="flex flex-1 flex-col" >
      {/* <div className="mb-6">
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          <Link href="/orgs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All orgs
          </Link>
        </Button>
      </div> */}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md">
        <div className="relative">
          <div className="h-36 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent" />
          <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-24 md:w-24">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={title}
                    className="h-full w-full object-cover opacity-95"
                  />
                ) : (
                  <div className="text-2xl font-semibold text-white/70">
                    {(title || "O").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
                  Organization
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-4xl">
                  {title}
                </h1>
                <div className="mt-1 text-sm text-white/55">@{org?.slug ?? orgBySlug?.slug ?? slug}</div>
                {description ? (
                  <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                    {description}
                  </div>
                ) : (
                  <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
                    No description yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                asChild
              >
                <Link href="/join">Join TraderLaunchpad</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6 text-white/70 backdrop-blur-md">
        <div className="text-sm font-semibold text-white">Public org profile</div>
        <div className="mt-2 text-sm">
          Next: we can surface org stats, top traders, recent trade ideas, and a “Request to join” flow.
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}

