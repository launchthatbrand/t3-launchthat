import {
  PORTAL_TENANT_ID,
  PORTAL_TENANT_SLUG,
  PORTAL_TENANT_SUMMARY,
} from "~/lib/tenant-fetcher";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { getConvex } from "~/lib/convex";

export async function resolveSupportOrganizationId(
  convex: ReturnType<typeof getConvex>,
  candidate: string,
): Promise<Id<"organizations"> | null> {
  if (!candidate) {
    return null;
  }

  if (candidate === PORTAL_TENANT_ID || candidate === PORTAL_TENANT_SLUG) {
    return PORTAL_TENANT_ID;
  }

  // Convex document IDs are typically 32 characters (e.g. "ns7d...").
  // We accept both 24 (older/test fixtures) and 32 to avoid mis-classifying IDs as slugs.
  const isConvexId = /^[a-z0-9]{24}$/i.test(candidate) || /^[a-z0-9]{32}$/i.test(candidate);
  if (isConvexId) {
    return candidate as Id<"organizations">;
  }

  const slugCandidates = [
    candidate.toLowerCase(),
    PORTAL_TENANT_SUMMARY.slug,
  ].filter((slug, index, arr) => slug && arr.indexOf(slug) === index);

  for (const slug of slugCandidates) {
    const organization = await convex.query(
      api.core.organizations.queries.getBySlug,
      { slug },
    );
    if (organization?._id) {
      return organization._id;
    }
  }

  return null;
}
