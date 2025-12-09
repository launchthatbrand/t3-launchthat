/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { SupportSystem } from "launchthat-plugin-support";

import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

interface SupportSystemClientProps {
  params: { segments?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
  buildNavHref?: (slug: string) => string;
}

export function SupportSystemClient({
  params,
  searchParams,
  buildNavHref,
}: SupportSystemClientProps) {
  const { user } = useUser();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant) as
    | Id<"organizations">
    | undefined;

  if (!organizationId) {
    return (
      <div className="text-muted-foreground flex h-[60vh] items-center justify-center text-sm">
        Select an organization to view support data.
      </div>
    );
  }

  return (
    <SupportSystem
      organizationId={organizationId}
      tenantName={tenant?.name ?? "Organization"}
      params={params}
      searchParams={searchParams}
      buildNavHref={buildNavHref}
      currentAgent={
        user
          ? {
              id: user.id,
              name:
                user.fullName ??
                user.primaryEmailAddress?.emailAddress ??
                "Support agent",
              imageUrl: user.imageUrl ?? undefined,
            }
          : undefined
      }
    />
  );
}
