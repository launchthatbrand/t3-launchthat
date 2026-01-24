"use client";

import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { OrgPublicProfile } from "~/components/publicProfiles/OrgPublicProfile";

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

  return (
    <div className="flex flex-1 flex-col">
      {org ? (
        <OrgPublicProfile
          mode="public"
          canEdit={false}
          org={{
            _id: org._id,
            name: org.name,
            slug: org.slug,
            description: org.description,
            logoUrl: org.logoUrl,
            publicProfileConfig: org.publicProfileConfig as any,
          }}
        />
      ) : null}

      <div className="h-24" />
    </div>
  );
}

