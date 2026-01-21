import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Minimal multi-tenant core schema, extracted from Portal.
 *
 * This is the shared foundation for features like notifications that need:
 * - Convex `users` table with Clerk identity mapping
 * - `organizations` + `userOrganizations` membership mapping
 */
export default defineSchema({
  users: defineTable({
    // Identity
    email: v.string(),
    tokenIdentifier: v.optional(v.string()),
    clerkId: v.optional(v.string()),

    // Profile
    name: v.optional(v.string()),
    image: v.optional(v.string()),

    // Convenience: default/last-selected org for apps that have an "active org"
    organizationId: v.optional(v.id("organizations")),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_organization", ["organizationId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),

    // Optional mapping to external identity providers
    clerkOrganizationId: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_clerk_org_id", ["clerkOrganizationId"]),

  userOrganizations: defineTable({
    userId: v.id("users"),
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

