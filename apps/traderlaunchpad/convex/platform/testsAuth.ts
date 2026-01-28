/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

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

    let viewer: any =
      (await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first()) ?? null;

    if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
      viewer = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .first();
    }

    if (!viewer) throw new Error("Unauthorized");
    if (!viewer.isAdmin) throw new Error("Forbidden");
    return null;
  },
});

