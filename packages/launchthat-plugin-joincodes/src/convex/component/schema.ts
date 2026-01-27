import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  joinCodes: defineTable({
    scope: v.union(v.literal("platform"), v.literal("organization")),
    organizationId: v.optional(v.string()),
    code: v.optional(v.string()),
    codeHash: v.string(),
    label: v.optional(v.string()),
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
    /**
     * App-specific grants/payload for join codes.
     *
     * This plugin intentionally stays generic; different apps can store the
     * entitlement/limits/config they want to apply when a code is redeemed.
     */
    grants: v.optional(v.any()),
    maxUses: v.optional(v.number()),
    uses: v.number(),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdByUserId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code_hash", ["codeHash"])
    .index("by_scope", ["scope"])
    .index("by_scope_org", ["scope", "organizationId"])
    .index("by_org", ["organizationId"]),

  joinCodeRedemptions: defineTable({
    codeId: v.id("joinCodes"),
    redeemedByUserId: v.string(),
    redeemedAt: v.number(),
  })
    .index("by_code", ["codeId"])
    .index("by_user", ["redeemedByUserId"]),
});
