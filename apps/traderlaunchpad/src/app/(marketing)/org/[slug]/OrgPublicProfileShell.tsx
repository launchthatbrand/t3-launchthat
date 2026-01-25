"use client";

import * as React from "react";

import { OrgPublicProfile } from "~/components/publicProfiles/OrgPublicProfile";
import { api } from "@convex-config/_generated/api";
import { usePathname } from "next/navigation";
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
  publicProfileConfig?: unknown;
}

export function OrgPublicProfileShell(props: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();

  const orgBySlug = useQuery(
    api.coreTenant.organizations.getOrganizationBySlug,
    props.slug ? { slug: props.slug } : "skip",
  ) as OrgSlugRow | null | undefined;

  const orgId = orgBySlug?._id ?? "";

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    orgId ? { organizationId: orgId } : "skip",
  ) as OrgDetailRow | null | undefined;

  if (!org) {
    return <div className="py-10 text-sm text-white/60">Organization not found.</div>;
  }

  const baseHref = `/org/${encodeURIComponent(org.slug)}`;
  const tabs = [
    {
      label: "Dashboard",
      href: baseHref,
      isActive: pathname === baseHref || pathname === `${baseHref}/`,
    },
    {
      label: "Trade Ideas",
      href: `${baseHref}/tradeideas`,
      isActive: pathname?.startsWith(`${baseHref}/tradeideas`),
    },
    {
      label: "Orders",
      href: `${baseHref}/orders`,
      isActive: pathname?.startsWith(`${baseHref}/orders`),
    },
  ];

  return (
    <>
      <OrgPublicProfile
        mode="public"
        canEdit={false}
        tabs={tabs}
        org={{
          _id: org._id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          logoUrl: org.logoUrl,
          publicProfileConfig: org.publicProfileConfig as any,
        }}
      />

      <div className="mt-8">{props.children}</div>
    </>
  );
}

