import { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG } from "@/convex/constants";

import { ConvexHttpClient } from "convex/browser";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { env } from "~/env";

export { PORTAL_TENANT_ID, PORTAL_TENANT_SLUG };

export interface TenantSummary {
  _id: Id<"organizations">;
  slug: string;
  name: string;
  planId?: Id<"plans"> | null;
  customDomain?: string | null;
}

export const PORTAL_TENANT_SUMMARY: TenantSummary = {
  _id: PORTAL_TENANT_ID,
  slug: PORTAL_TENANT_SLUG,
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
): Id<"organizations"> | undefined => tenant?._id ?? undefined;

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
  const normalizedSlug = (slug ?? PORTAL_TENANT_SLUG).toLowerCase();

  const cached = tenantCache.get(normalizedSlug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const tenant = await getConvexClient()
    .query(api.core.organizations.queries.getBySlug, { slug: normalizedSlug })
    .catch((error) => {
      console.error("[tenant-fetcher] failed to load tenant", {
        slug: normalizedSlug,
        error,
      });
      return null;
    });

  if (!tenant) {
    tenantCache.delete(normalizedSlug);
    return normalizedSlug === PORTAL_TENANT_SLUG ? PORTAL_TENANT_SUMMARY : null;
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
