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

    // Portal parity: basic branding fields.
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    logoMediaId: v.optional(v.id("organizationMedia")),

    // Optional mapping to external identity providers
    clerkOrganizationId: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_clerk_org_id", ["clerkOrganizationId"]),

  organizationMedia: defineTable({
    organizationId: v.id("organizations"),
    uploadedByUserId: v.string(),
    storageId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    filename: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_uploadedBy", ["organizationId", "uploadedByUserId"]),

  organizationDomains: defineTable({
    organizationId: v.id("organizations"),
    appKey: v.string(),
    hostname: v.string(),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.optional(
      v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          value: v.string(),
        }),
      ),
    ),
    verifiedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_appKey_hostname", ["appKey", "hostname"])
    .index("by_org_appKey", ["organizationId", "appKey"])
    .index("by_org", ["organizationId"]),

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

