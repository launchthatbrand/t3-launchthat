import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

// NOTE: This helper is intended for Next.js middleware / server components.
// It performs host -> organization resolution by calling core-tenant Convex component queries.

export interface OrgSummary {
  _id: string;
  slug: string;
  name: string;
}

interface CacheEntry {
  value: OrgSummary | null;
  expiresAt: number;
}

type GetOrganizationBySlugRef = FunctionReference<
  "query",
  "public",
  { slug: string },
  unknown
>;

type GetOrganizationByHostnameRef = FunctionReference<
  "query",
  "public",
  { appKey: string; hostname: string; requireVerified?: boolean },
  unknown
>;

export interface CoreTenantApiBinding {
  launchthat_core_tenant: {
    queries: {
      getOrganizationBySlug: GetOrganizationBySlugRef;
      getOrganizationByHostname: GetOrganizationByHostnameRef;
    };
  };
}

const DEFAULT_TTL_MS = process.env.NODE_ENV === "development" ? 0 : 60_000;
const cache = new Map<string, CacheEntry>();

const normalizeHostname = (input: string): string => {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";
  const candidate = raw.includes("://")
    ? (() => {
        try {
          return new URL(raw).hostname;
        } catch {
          return raw;
        }
      })()
    : raw;
  return candidate.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
};

const normalizeSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const readCache = (key: string): OrgSummary | null | undefined => {
  if (DEFAULT_TTL_MS <= 0) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

const writeCache = (key: string, value: OrgSummary | null) => {
  if (DEFAULT_TTL_MS <= 0) return;
  cache.set(key, { value, expiresAt: Date.now() + DEFAULT_TTL_MS });
};

export const clearTenantCache = () => cache.clear();

const parseOrgSummary = (input: unknown): OrgSummary | null => {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const id = obj._id;
  const slug = obj.slug;
  const name = obj.name;
  if (typeof id !== "string" || typeof slug !== "string" || typeof name !== "string") {
    return null;
  }
  return { _id: id, slug, name };
};

export const createCoreTenantResolver = (args: {
  convexUrl: string;
  api: CoreTenantApiBinding;
}) => {
  const client = new ConvexHttpClient(args.convexUrl);

  const fetchOrgBySlug = async (slug: string): Promise<OrgSummary | null> => {
    const normalized = normalizeSlug(slug);
    if (!normalized) return null;
    const cacheKey = `slug:${normalized}`;
    const cached = readCache(cacheKey);
    if (cached !== undefined) return cached;

    const org = await client.query(
      args.api.launchthat_core_tenant.queries.getOrganizationBySlug,
      { slug: normalized },
    );
    const value = parseOrgSummary(org);
    writeCache(cacheKey, value);
    return value;
  };

  const fetchOrgByHostname = async (params: {
    appKey: string;
    hostname: string;
    requireVerified?: boolean;
  }): Promise<OrgSummary | null> => {
    const appKey = params.appKey.trim().toLowerCase();
    const hostname = normalizeHostname(params.hostname);
    if (!appKey || !hostname) return null;
    const cacheKey = `host:${appKey}:${hostname}:${params.requireVerified === false ? "any" : "verified"}`;
    const cached = readCache(cacheKey);
    if (cached !== undefined) return cached;

    const org = await client.query(
      args.api.launchthat_core_tenant.queries.getOrganizationByHostname,
      {
        appKey,
        hostname,
        requireVerified: params.requireVerified,
      },
    );
    const value = parseOrgSummary(org);
    writeCache(cacheKey, value);
    return value;
  };

  return { fetchOrgBySlug, fetchOrgByHostname };
};

