import { v } from "convex/values";

import { query } from "./_generated/server";

export const listJoinCodes = query({
  args: {
    scope: v.union(v.literal("platform"), v.literal("organization")),
    organizationId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("joinCodes"),
      scope: v.union(v.literal("platform"), v.literal("organization")),
      organizationId: v.optional(v.string()),
      label: v.optional(v.string()),
      maxUses: v.optional(v.number()),
      uses: v.number(),
      expiresAt: v.optional(v.number()),
      isActive: v.boolean(),
      createdByUserId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const scope = args.scope;
    const orgId =
      typeof args.organizationId === "string" ? args.organizationId : undefined;

    if (scope === "organization" && !orgId) {
      return [];
    }

    if (scope === "organization") {
      return await ctx.db
        .query("joinCodes")
        .withIndex("by_scope_org", (q) =>
          q.eq("scope", "organization").eq("organizationId", orgId),
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("joinCodes")
      .withIndex("by_scope", (q) => q.eq("scope", "platform"))
      .order("desc")
      .collect();
  },
});
