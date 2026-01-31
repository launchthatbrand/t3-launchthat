/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { resolveViewerIsAdmin } from "../traderlaunchpad/lib/resolve";

/**
 * Actions can't access `ctx.db`, so platform tests actions call this internal query
 * to enforce platform-admin access.
 */
export const assertPlatformAdmin = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    // Local dev ergonomics:
    // Some local-host routes run under TenantConvexProvider without a Convex auth identity
    // (see host-mode.ts notes). For platform tooling like `/platform/data`, allow access
    // in non-production environments even if a Convex identity is missing.
    //
    // Security note: this ONLY applies to non-production deployments.
    if (!identity) {
      if (process.env.NODE_ENV !== "production") return null;
      throw new Error("Unauthorized");
    }

    const isAdmin = await resolveViewerIsAdmin(ctx);
    if (!isAdmin) throw new Error("Forbidden");
    return null;
  },
});

