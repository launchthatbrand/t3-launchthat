import { defineTable } from "convex/server";
import { v } from "convex/values";

export const reactionsTable = defineTable({
  // portal user id / subject
  userId: v.string(),

  // feed item reacted to (component table id)
  feedItemId: v.id("feedItems"),

  reactionType: v.union(
    v.literal("like"),
    v.literal("love"),
    v.literal("celebrate"),
    v.literal("support"),
    v.literal("insightful"),
    v.literal("curious"),
  ),
})
  .index("by_user", ["userId"])
  .index("by_feed_item", ["feedItemId"])
  .index("by_user_and_item", ["userId", "feedItemId"]);

export const reactionsSchema = {
  reactions: reactionsTable,
};
