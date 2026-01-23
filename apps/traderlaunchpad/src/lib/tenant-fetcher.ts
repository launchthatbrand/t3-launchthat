import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex-config/_generated/api";

import { env } from "~/env";

export interface TenantSummary {
  _id: string;
  slug: string;
  name: string;
  customDomain?: string | null;
}

// In dev we want tenant branding changes (name/slug) to reflect immediately.
// In production, a short edge cache helps reduce Convex lookups.
const TENANT_CACHE_TTL_MS = process.env.NODE_ENV === "development" ? 0 : 60 * 1000;
const SHOULD_CACHE_TENANT = TENANT_CACHE_TTL_MS > 0;

const tenantCache = new Map<string, { tenant: TenantSummary; expiresAt: number }>();

let convexClient: ConvexHttpClient | null = null;
const getConvexClient = () => {
  if (!convexClient) {
    const url = env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("Missing NEXT_PUBLIC_CONVEX_URL; cannot resolve tenant.");
    }
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
};

const getDefaultOrgIdOrNull = (): string | null => {
  const raw = env.TRADERLAUNCHPAD_DEFAULT_ORG_ID;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return null;
  return /^[a-z0-9]{32}$/.test(trimmed) ? trimmed : null;
};

const getDefaultTenantSlug = (): string => {
  const raw = env.TRADERLAUNCHPAD_DEFAULT_TENANT_SLUG;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || "default";
};

export async function fetchTenantBySlug(slug: string | null): Promise<TenantSummary | null> {
  const normalizedSlug = (slug ?? "").trim().toLowerCase();

  const cacheKey = normalizedSlug ? `slug:${normalizedSlug}` : "default";
  if (SHOULD_CACHE_TENANT) {
    const cached = tenantCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
  }

  const tenant =
    normalizedSlug.length > 0
      ? await getConvexClient()
          .query(api.coreTenant.organizations.getOrganizationBySlug, {
            slug: normalizedSlug,
          })
          .catch((error) => {
            console.error("[tenant-fetcher] failed to load tenant by slug", {
              slug: normalizedSlug,
              error,
            });
            return null;
          })
      : await (async () => {
          const id = getDefaultOrgIdOrNull();
          if (id) {
            return await getConvexClient()
              .query(api.coreTenant.organizations.getOrganizationById, {
                organizationId: id,
              })
              .catch((error) => {
                console.error("[tenant-fetcher] failed to load default tenant by id", {
                  organizationId: id,
                  error,
                });
                return null;
              });
          }

          const slug = getDefaultTenantSlug().toLowerCase();
          return await getConvexClient()
            .query(api.coreTenant.organizations.getOrganizationBySlug, { slug })
            .catch((error) => {
              console.error("[tenant-fetcher] failed to load default tenant by slug", {
                slug,
                error,
              });
              return null;
            });
        })();

  if (!tenant) {
    tenantCache.delete(cacheKey);
    return null;
  }

  const summary: TenantSummary = {
    _id: tenant._id,
    slug: tenant.slug,
    name: tenant.name,
    customDomain: null,
  };

  if (SHOULD_CACHE_TENANT) {
    tenantCache.set(cacheKey, { tenant: summary, expiresAt: Date.now() + TENANT_CACHE_TTL_MS });
  }

  return summary;
}

export async function fetchTenantByCustomDomain(
  hostname: string | null,
): Promise<TenantSummary | null> {
  const normalizedHost = (hostname ?? "").trim().toLowerCase().replace(/^www\./, "");
  if (!normalizedHost) return null;

  const cacheKey = `domain:${normalizedHost}`;
  if (SHOULD_CACHE_TENANT) {
    const cached = tenantCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
  }

  const tenant = await getConvexClient()
    .query(api.coreTenant.organizations.getOrganizationByHostname, {
      hostname: normalizedHost,
      appKey: "traderlaunchpad",
      requireVerified: true,
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
    // `getOrganizationByHostname` resolves through a domain mapping, but doesn't return the domain.
    // Preserve it here for middleware headers / downstream server components.
    customDomain: normalizedHost,
  };

  if (SHOULD_CACHE_TENANT) {
    tenantCache.set(cacheKey, { tenant: summary, expiresAt: Date.now() + TENANT_CACHE_TTL_MS });
  }

  return summary;
}

export function clearTenantCache(key?: string) {
  if (key) tenantCache.delete(key);
  else tenantCache.clear();
}

