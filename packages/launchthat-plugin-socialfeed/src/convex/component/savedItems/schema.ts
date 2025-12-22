import { defineTable } from "convex/server";
import { v } from "convex/values";

export const savedItemsTable = defineTable({
  userId: v.string(),
  feedItemId: v.id("feedItems"),
  collectionName: v.optional(v.string()),
  notes: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_feed_item", ["feedItemId"])
  .index("by_user_and_collection", ["userId", "collectionName"]);

export const savedItemsSchema = {
  savedItems: savedItemsTable,
};


