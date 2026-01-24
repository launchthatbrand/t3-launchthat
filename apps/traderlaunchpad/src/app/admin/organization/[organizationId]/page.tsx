"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { OrgPublicProfile } from "~/components/publicProfiles/OrgPublicProfile";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";

interface OrgRow {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
  publicProfileConfig?: unknown;
}

export default function AdminOrgPublicProfilePage() {
  const params = useParams<{ organizationId?: string | string[] }>();
  const raw = params.organizationId;
  const organizationId = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const myOrganizations = useQuery(
    api.coreTenant.organizations.myOrganizations,
    shouldQuery ? {} : "skip",
  ) as { _id: string; userRole: string }[] | undefined;

  const myRole =
    myOrganizations?.find((o) => String(o._id) === String(organizationId))?.userRole ?? "";
  const canEdit = myRole === "owner" || myRole === "admin";

  const org = useQuery(
    api.coreTenant.organizations.getOrganizationById,
    shouldQuery && organizationId ? { organizationId } : "skip",
  ) as OrgRow | null | undefined;

  if (!org) return null;

  return (
    <div className="p-4 md:p-8">
      <OrgPublicProfile
        mode="admin"
        canEdit={canEdit}
        org={{
          _id: org._id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          logoUrl: org.logoUrl,
          publicProfileConfig: org.publicProfileConfig as any,
        }}
      />
    </div>
  );
}

