import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Minimal multi-tenant core schema, extracted from Portal.
 *
 * This is the shared foundation for features like notifications that need:
 * - `organizations` + `userOrganizations` membership mapping
 *
 * Design decision:
 * - `users` is app-owned (root table per application)
 * - This component stores orgs + memberships keyed by `userId: string`
 */
export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(),

    // Optional mapping to external identity providers
    clerkOrganizationId: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_clerk_org_id", ["clerkOrganizationId"]),

  userOrganizations: defineTable({
    userId: v.string(),
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
      v.literal("student"),
    ),
    isActive: v.boolean(),
    joinedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_organization", ["userId", "organizationId"])
    .index("by_user_active", ["userId", "isActive"]),
});

