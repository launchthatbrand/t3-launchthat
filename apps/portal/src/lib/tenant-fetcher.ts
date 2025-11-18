import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export interface TenantSummary {
  _id: Id<"organizations">;
  slug: string;
  name: string;
  planId?: Id<"plans"> | null;
  customDomain?: string | null;
}

export const PORTAL_TENANT_ID = "portal-root" as Id<"organizations">;

export const PORTAL_TENANT_SUMMARY: TenantSummary = {
  _id: PORTAL_TENANT_ID,
  slug: "portal",
  name: "Portal",
  planId: null,
  customDomain: null,
};

export const isPortalTenantId = (id?: Id<"organizations"> | null) =>
  !!id && id === PORTAL_TENANT_ID;

export const isPortalTenant = (tenant?: TenantSummary | null) =>
  isPortalTenantId(tenant?._id);

export const getTenantOrganizationId = (
  tenant?: TenantSummary | null,
): Id<"organizations"> | undefined =>
  tenant?._id && !isPortalTenantId(tenant._id) ? tenant._id : undefined;

const TENANT_CACHE_TTL_MS = 60 * 1000; // 1 minute edge cache
const tenantCache = new Map<
  string,
  { tenant: TenantSummary; expiresAt: number }
>();

let convexClient: ConvexHttpClient | null = null;
const getConvexClient = () => {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  }
  return convexClient;
};

export async function fetchTenantBySlug(
  slug: string | null,
): Promise<TenantSummary | null> {
  if (!slug) return PORTAL_TENANT_SUMMARY;
  const normalizedSlug = slug.toLowerCase();

  const cached = tenantCache.get(normalizedSlug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const tenant = await getConvexClient().query(
    api.core.organizations.queries.getBySlug,
    { slug: normalizedSlug },
  );

  if (!tenant) {
    tenantCache.delete(normalizedSlug);
    return null;
  }

  const summary: TenantSummary = {
    _id: tenant._id,
    slug: tenant.slug,
    name: tenant.name,
    planId: tenant.planId ?? null,
    customDomain: tenant.customDomain ?? null,
  };

  tenantCache.set(normalizedSlug, {
    tenant: summary,
    expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
  });

  return summary;
}

export function clearTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug.toLowerCase());
  } else {
    tenantCache.clear();
  }
}
