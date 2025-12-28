import "server-only";

import type { Id } from "@/convex/_generated/dataModel";
import { headers } from "next/headers";

import type { TenantSummary } from "./tenant-fetcher";
import { PORTAL_TENANT_SUMMARY } from "./tenant-fetcher";

export async function getActiveTenantFromHeaders(): Promise<TenantSummary | null> {
  const headerList: Headers = await headers();
  const id: string | null = headerList.get("x-tenant-id");
  const slug: string | null = headerList.get("x-tenant-slug");
  const encodedName: string | null = headerList.get("x-tenant-name");
  const logo: string | null = headerList.get("x-tenant-logo");

  if (!id || !slug || !encodedName) {
    return PORTAL_TENANT_SUMMARY;
  }

  const planId: string | null = headerList.get("x-tenant-plan-id");
  const customDomain: string | null = headerList.get("x-tenant-custom-domain");

  return {
    _id: id as Id<"organizations">,
    slug,
    name: decodeURIComponent(encodedName),
    logo,
    planId: planId ? (planId as Id<"plans">) : null,
    customDomain,
  };
}
