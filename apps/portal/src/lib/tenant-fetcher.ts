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
  if (!slug) return null;
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
