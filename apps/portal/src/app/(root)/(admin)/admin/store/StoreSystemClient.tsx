"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { StoreSystem } from "launchthat-plugin-commerce";

import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

interface StoreSystemClientProps {
  params: { segments?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
}

export function StoreSystemClient({
  params,
  searchParams,
}: StoreSystemClientProps) {
  const tenant = useTenant();
  const { user } = useUser();
  const organizationId = getTenantOrganizationId(tenant) as
    | Id<"organizations">
    | undefined;

  if (!organizationId) {
    return (
      <div className="text-muted-foreground flex h-[60vh] items-center justify-center text-sm">
        Select an organization to manage store data.
      </div>
    );
  }

  return (
    <StoreSystem
      organizationId={organizationId}
      tenantName={tenant?.name ?? "Organization"}
      params={params}
      searchParams={searchParams}
      currentUser={
        user
          ? {
              id: user.id,
              name:
                user.fullName ??
                user.primaryEmailAddress?.emailAddress ??
                "Store admin",
              imageUrl: user.imageUrl ?? undefined,
            }
          : undefined
      }
    />
  );
}
