import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// Define validator for hashtag responses
export const hashtagResponseValidator = v.object({
    _id: v.id("hashtags"),
    _creationTime: v.number(),
    tag: v.string(),
    usageCount: v.number(),
    lastUsed: v.number(),
    category: v.optional(v.string()),
    isBlocked: v.optional(v.boolean()),
    relatedTags: v.optional(v.array(v.string())),
    // Add new fields for topics
    followerCount: v.optional(v.number()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isTopic: v.optional(v.boolean()),
});
// Define the Hashtags table for tracking trending and popular hashtags
export const hashtagsTable = defineTable({
    // The tag itself (without the # symbol)
    tag: v.string(),
    // Usage statistics
    usageCount: v.number(),
    // Timestamps for tracking trending status
    lastUsed: v.number(),
    // For categorization and moderation
    category: v.optional(v.string()),
    isBlocked: v.optional(v.boolean()),
    // Related tags
    relatedTags: v.optional(v.array(v.string())),
    // New fields for topic following functionality
    followerCount: v.optional(v.number()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    isTopic: v.optional(v.boolean()),
    // Engagement metrics for trending calculation
    recentEngagement: v.optional(v.number()),
    weeklyEngagement: v.optional(v.number()),
    lastUpdated: v.optional(v.number()),
})
    .index("by_tag", ["tag"]) // Quick lookup by tag name
    .index("by_usageCount", ["usageCount"]) // For finding popular tags
    .index("by_lastUsed", ["lastUsed"]) // For finding trending/recent tags
    .index("by_category", ["category"]) // For finding tags by category
    .index("by_followerCount", ["followerCount"]) // For finding popular topics
    .index("by_isTopic", ["isTopic"]) // For filtering actual topics vs regular hashtags
    .index("by_recentEngagement", ["recentEngagement"]); // For trending topics
// Export the schema
export const hashtagsSchema = defineSchema({
    hashtags: hashtagsTable,
});
export default hashtagsSchema;
