import type { Id } from "./_generated/dataModel";

/**
 * Identifier used to represent the portal/root tenant when an explicit organization
 * document does not exist. Must stay in sync with apps/portal/src/lib/tenant-fetcher.ts.
 */
export const PORTAL_TENANT_ID = "portal-root" as Id<"organizations">;

