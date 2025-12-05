import type { Id } from "./_generated/dataModel";

/**
 * Portal/root tenant metadata. `PORTAL_TENANT_ID` is the Convex document id that
 * now exists in the organizations table. `PORTAL_TENANT_SLUG` remains the
 * friendly slug used for routing (base domain).
 */
const RAW_PORTAL_TENANT_ID = "ns75en97f3e470h9ttg45sc0ts7wp7p5";
export const PORTAL_TENANT_ID = RAW_PORTAL_TENANT_ID as Id<"organizations">;
export const PORTAL_TENANT_SLUG = "portal-root";

export const isPortalOrganizationValue = (
  candidate: Id<"organizations"> | string | null | undefined,
): candidate is Id<"organizations"> | typeof PORTAL_TENANT_SLUG =>
  candidate === PORTAL_TENANT_ID || candidate === PORTAL_TENANT_SLUG;

export const normalizeOrganizationId = (
  candidate: Id<"organizations"> | typeof PORTAL_TENANT_SLUG,
): Id<"organizations"> => {
  if (candidate === PORTAL_TENANT_SLUG) {
    return PORTAL_TENANT_ID;
  }
  return candidate;
};
