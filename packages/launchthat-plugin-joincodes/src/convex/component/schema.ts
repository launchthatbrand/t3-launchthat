import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  joinCodes: defineTable({
    scope: v.union(v.literal("platform"), v.literal("organization")),
    organizationId: v.optional(v.string()),
    codeHash: v.string(),
    label: v.optional(v.string()),
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
