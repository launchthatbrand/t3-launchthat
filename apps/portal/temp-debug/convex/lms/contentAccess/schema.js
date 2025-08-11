import { defineTable } from "convex/server";
import { v } from "convex/values";
// Content Access Rules table - defines tag-based access control for content
export const contentAccessRulesTable = defineTable({
    // Content reference
    contentType: v.union(v.literal("course"), v.literal("lesson"), v.literal("topic"), v.literal("download"), v.literal("product"), v.literal("quiz")),
    contentId: v.string(), // Generic string ID to reference any content type
    // Public access override
    isPublic: v.optional(v.boolean()), // If true, content is publicly accessible regardless of tags
    // Active status
    isActive: v.optional(v.boolean()), // If false, rules are disabled
    // Priority for rule evaluation
    priority: v.optional(v.number()), // Higher priority rules take precedence
    // Required tags - users must have these tags to access content
    requiredTags: v.object({
        mode: v.union(v.literal("all"), v.literal("some")), // "all" = AND logic, "some" = OR logic
        tagIds: v.array(v.id("marketingTags")),
    }),
    // Excluded tags - users with these tags cannot access content
    excludedTags: v.object({
        mode: v.union(v.literal("all"), v.literal("some")), // "all" = AND logic, "some" = OR logic
        tagIds: v.array(v.id("marketingTags")),
    }),
    // Metadata
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
})
    .index("by_content", ["contentType", "contentId"])
    .index("by_contentType", ["contentType"])
    .index("by_active", ["isActive"])
    .index("by_priority", ["priority"]);
// Content Access Log table - tracks access attempts for auditing
export const contentAccessLogTable = defineTable({
    userId: v.id("users"),
    contentType: v.union(v.literal("course"), v.literal("lesson"), v.literal("topic"), v.literal("download"), v.literal("product"), v.literal("quiz")),
    contentId: v.string(),
    accessGranted: v.boolean(),
    reason: v.optional(v.string()), // Why access was granted/denied
    userTags: v.optional(v.array(v.id("marketingTags"))), // User's tags at time of access
    accessedAt: v.number(),
})
    .index("by_user", ["userId"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_time", ["accessedAt"]);
