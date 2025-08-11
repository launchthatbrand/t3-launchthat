import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// Define the Saved Items table
export const savedItemsTable = defineTable({
    // User who saved the item
    userId: v.id("users"),
    // Feed item that was saved
    feedItemId: v.id("feedItems"),
    // Optional collection/folder name
    collectionName: v.optional(v.string()),
    // Optional notes added by the user
    notes: v.optional(v.string()),
    // Timestamps are automatically added by Convex (_creationTime)
})
    .index("by_user", ["userId"])
    .index("by_feed_item", ["feedItemId"])
    .index("by_user_and_collection", ["userId", "collectionName"]);
// Export the schema
export const savedItemsSchema = defineSchema({
    savedItems: savedItemsTable,
});
export default savedItemsSchema;
