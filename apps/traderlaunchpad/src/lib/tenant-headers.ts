import "server-only";

import { getActiveTenantFromHeaders as getActiveTenantFromHeadersShared } from "launchthat-plugin-core-tenant/next/tenant-headers";

import type { TenantSummary } from "./tenant-fetcher";

export async function getActiveTenantFromHeaders(): Promise<TenantSummary | null> {
  const tenant = await getActiveTenantFromHeadersShared();
  if (!tenant) return null;

  return {
    _id: tenant._id,
    slug: tenant.slug,
    name: decodeURIComponent(String(tenant.name ?? "")) || tenant.slug,
    customDomain: tenant.customDomain ?? null,
  };
}

