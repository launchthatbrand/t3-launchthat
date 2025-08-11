import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// Define the Feed Subscriptions table
export const subscriptionsTable = defineTable({
    // User who is following/subscribing
    userId: v.id("users"),
    // Type of entity being followed
    followType: v.union(v.literal("user"), v.literal("topic"), v.literal("group"), v.literal("hashtag")),
    // ID of the entity being followed
    // This is a string since it could be different types (user ID, topic name, etc.)
    followId: v.string(),
    // Additional metadata
    notificationsEnabled: v.optional(v.boolean()),
    // Timestamps are automatically added by Convex (_creationTime)
})
    .index("by_user", ["userId"])
    .index("by_follow_type_and_id", ["followType", "followId"])
    .index("by_user_and_type", ["userId", "followType"])
    .index("by_user_follow", ["userId", "followType", "followId"]);
// Export the schema
export const subscriptionsSchema = defineSchema({
    subscriptions: subscriptionsTable,
});
export default subscriptionsSchema;
