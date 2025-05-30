/**
 * @deprecated Use groups/ directory instead
 *
 * This file is maintained for backward compatibility during the refactoring.
 * All group functionality has been moved to the groups/ directory.
 */

import { v } from "convex/values";

import { query } from "./_generated/server";

// Re-export the countPendingInvitationsByClerkId function to maintain backwards compatibility
export const countPendingInvitationsByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      return 0;
    }

    // Get user ID from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.clerkId))
      .first();

    if (!user) {
      return 0; // User not found
    }

    // Count pending invitations
    const pendingInvitations = await ctx.db
      .query("groupInvitations")
      .withIndex("by_invited_user", (q) => q.eq("invitedUserId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return pendingInvitations.length;
  },
});

// Functions previously in ./groups/index.ts and ./groups/posts.ts should be here directly
// or imported from their new specific locations if they exist elsewhere in groups/lib or similar.

// export * from "./groups/index"; // Removed problematic re-export
// export * from "./groups/posts"; // Removed problematic re-export
