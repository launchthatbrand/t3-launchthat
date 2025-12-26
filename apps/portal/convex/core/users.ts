import { v } from "convex/values";

import { query } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Back-compat wrapper for older clients that reference `core/users:getUserByClerkId`.
 *
 * Canonical implementation lives in `core/users/queries.ts`.
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.string(),
      role: v.optional(v.string()),
      tokenIdentifier: v.optional(v.string()),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
      addresses: v.optional(
        v.array(
          v.object({
            fullName: v.string(),
            addressLine1: v.string(),
            addressLine2: v.optional(v.string()),
            city: v.string(),
            stateOrProvince: v.string(),
            postalCode: v.string(),
            country: v.string(),
            phoneNumber: v.optional(v.string()),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.core.users.queries.getUserByClerkId, {
      clerkId: args.clerkId,
    });
    return user;
  },
});


