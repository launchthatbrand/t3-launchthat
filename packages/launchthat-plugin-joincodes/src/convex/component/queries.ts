import { query } from "./_generated/server";
import { v } from "convex/values";

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
      code: v.optional(v.string()),
      role: v.optional(v.union(v.literal("user"), v.literal("staff"), v.literal("admin"))),
      tier: v.optional(v.union(v.literal("free"), v.literal("standard"), v.literal("pro"))),
      permissions: v.optional(
        v.object({
          globalEnabled: v.optional(v.boolean()),
          tradeIdeasEnabled: v.optional(v.boolean()),
          openPositionsEnabled: v.optional(v.boolean()),
          ordersEnabled: v.optional(v.boolean()),
        }),
      ),
      grants: v.optional(v.any()),
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

    const rows =
      scope === "organization"
        ? await ctx.db
          .query("joinCodes")
          .withIndex("by_scope_org", (q) =>
            q.eq("scope", "organization").eq("organizationId", orgId),
          )
          .order("desc")
          .collect()
        : await ctx.db
          .query("joinCodes")
          .withIndex("by_scope", (q) => q.eq("scope", "platform"))
          .order("desc")
          .collect();

    return (Array.isArray(rows) ? rows : []).map((row) => ({
      _id: row._id,
      scope: row.scope,
      organizationId: row.organizationId,
      label: row.label,
      code: row.code,
      role: row.role,
      tier: row.tier,
      permissions: row.permissions,
      grants: (row as any).grants,
      maxUses: row.maxUses,
      uses: row.uses,
      expiresAt: row.expiresAt,
      isActive: row.isActive,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});
