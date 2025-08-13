import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get list of users who have access to a download
 */

/**
 * Check if the current user has admin role
 */
export const checkIsAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return false;
    }

    // Check if the user has admin role
    return user.role === "admin";
  },
});
