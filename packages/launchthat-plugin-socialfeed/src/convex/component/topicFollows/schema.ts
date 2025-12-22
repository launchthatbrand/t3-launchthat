import { defineTable } from "convex/server";
import { v } from "convex/values";

export const topicFollowsTable = defineTable({
  userId: v.string(),
  topicId: v.id("hashtags"),
  followedAt: v.number(),
  engagementLevel: v.optional(v.number()),
  lastEngagement: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_topic", ["topicId"])
  .index("by_user_and_topic", ["userId", "topicId"]);

export const topicFollowsSchema = {
  topicFollows: topicFollowsTable,
};


