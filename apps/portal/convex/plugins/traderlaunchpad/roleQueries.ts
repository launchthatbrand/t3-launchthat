import { v } from "convex/values";

import { internalQuery } from "../../_generated/server";

/**
 * Used for Discord routing: mentors vs members.
 * NOTE: This must NOT be in a `"use node"` file (queries can't be node-only).
 */
export const getUserOrgRole = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("editor"),
    v.literal("viewer"),
    v.literal("student"),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("userOrganizations")
      .withIndex("by_user_organization", (q: any) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .first();
    if (!row || (row as any).isActive === false) return null;
    const role = (row as any).role;
    if (
      role === "owner" ||
      role === "admin" ||
      role === "editor" ||
      role === "viewer" ||
      role === "student"
    ) {
      return role;
    }
    return null;
  },
});


