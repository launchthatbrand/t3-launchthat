import "server-only";

import type { Id } from "@/convex/_generated/dataModel";
import { getActiveTenantFromHeaders as getActiveTenantFromHeadersShared } from "launchthat-plugin-core-tenant/next/tenant-headers";

import type { TenantSummary } from "./tenant-fetcher";
import { PORTAL_TENANT_SUMMARY } from "./tenant-fetcher";

export async function getActiveTenantFromHeaders(): Promise<TenantSummary | null> {
  const tenant = await getActiveTenantFromHeadersShared();
  if (!tenant) return PORTAL_TENANT_SUMMARY;

  return {
    _id: tenant._id as Id<"organizations">,
    slug: tenant.slug,
    name: decodeURIComponent(String(tenant.name ?? "")) || PORTAL_TENANT_SUMMARY.name,
    logo: tenant.logo ?? null,
    planId: tenant.planId ? (tenant.planId as Id<"plans">) : null,
    customDomain: tenant.customDomain ?? null,
  };
}
