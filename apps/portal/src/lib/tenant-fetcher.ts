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
  logo?: string | null;
  planId?: Id<"plans"> | null;
  customDomain?: string | null;
}

export const PORTAL_TENANT_SUMMARY: TenantSummary = {
  _id: PORTAL_TENANT_ID,
  slug: PORTAL_TENANT_SLUG,
  name: "Portal",
  logo: null,
  planId: null,
  customDomain: null,
};

export const isPortalTenantId = (id?: Id<"organizations"> | null) =>
  !!id && id === PORTAL_TENANT_ID;

export const isPortalTenant = (tenant?: TenantSummary | null) =>
  isPortalTenantId(tenant?._id);

export const getTenantOrganizationId = (
  tenant?: TenantSummary | null,
): Id<"organizations"> => (tenant?._id ?? PORTAL_TENANT_ID);

// In dev we want tenant branding changes (name/logo) to reflect immediately.
// In production, a short edge cache helps reduce Convex lookups.
const TENANT_CACHE_TTL_MS =
  process.env.NODE_ENV === "development" ? 0 : 60 * 1000;
const SHOULD_CACHE_TENANT = TENANT_CACHE_TTL_MS > 0;
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

  if (SHOULD_CACHE_TENANT) {
    const cached = tenantCache.get(normalizedSlug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
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
    logo: tenant.logo ?? null,
    planId: tenant.planId ?? null,
    customDomain: tenant.customDomain ?? null,
  };

  if (SHOULD_CACHE_TENANT) {
    tenantCache.set(normalizedSlug, {
      tenant: summary,
      expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
    });
  }

  return summary;
}

export async function fetchTenantByCustomDomain(
  hostname: string | null,
): Promise<TenantSummary | null> {
  const normalizedHost = (hostname ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (!normalizedHost) return null;

  const cacheKey = `domain:${normalizedHost}`;
  if (SHOULD_CACHE_TENANT) {
    const cached = tenantCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
  }

  const tenant = await getConvexClient()
    .query(api.core.organizations.queries.getByCustomDomain, {
      hostname: normalizedHost,
    })
    .catch((error) => {
      console.error("[tenant-fetcher] failed to load tenant by domain", {
        hostname: normalizedHost,
        error,
      });
      return null;
    });

  if (!tenant) {
    tenantCache.delete(cacheKey);
    return null;
  }

  const summary: TenantSummary = {
    _id: tenant._id,
    slug: tenant.slug,
    name: tenant.name,
    logo: tenant.logo ?? null,
    planId: tenant.planId ?? null,
    customDomain: tenant.customDomain ?? null,
  };

  if (SHOULD_CACHE_TENANT) {
    tenantCache.set(cacheKey, {
      tenant: summary,
      expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
    });
  }

  return summary;
}

export function clearTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug.toLowerCase());
  } else {
    tenantCache.clear();
  }
}
