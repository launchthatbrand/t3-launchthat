import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Topic Follows table to track users following topics
export const topicFollowsTable = defineTable({
  // The user following the topic
  userId: v.id("users"),

  // The topic (hashtag) being followed
  topicId: v.id("hashtags"),

  // When the follow relationship was created
  followedAt: v.number(),

  // Engagement level (how often the user interacts with this topic)
  engagementLevel: v.optional(v.number()),

  // Last time the user interacted with content from this topic
  lastEngagement: v.optional(v.number()),
})
  .index("by_user", ["userId"]) // For finding all topics a user follows
  .index("by_topic", ["topicId"]) // For finding all users following a topic
  .index("by_user_and_topic", ["userId", "topicId"]); // For checking if a user follows a specific topic

// Export the schema
export const topicFollowsSchema = {
  topicFollows: topicFollowsTable,
};
