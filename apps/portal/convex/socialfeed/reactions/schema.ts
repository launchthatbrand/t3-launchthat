import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Reactions table
export const reactionsTable = defineTable({
  // User who created the reaction
  userId: v.id("users"),

  // Feed item that was reacted to
  feedItemId: v.id("feedItems"),

  // Type of reaction
  reactionType: v.union(
    v.literal("like"),
    v.literal("love"),
    v.literal("celebrate"),
    v.literal("support"),
    v.literal("insightful"),
    v.literal("curious"),
  ),

  // Timestamps are automatically added by Convex (_creationTime)
})
  .index("by_user", ["userId"])
  .index("by_feed_item", ["feedItemId"])
  .index("by_user_and_item", ["userId", "feedItemId"]);

// Export the schema
export const reactionsSchema = {
  reactions: reactionsTable,
};
