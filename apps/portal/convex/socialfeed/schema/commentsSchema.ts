import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Comments table
export const commentsTable = defineTable({
  // Feed item being commented on
  feedItemId: v.id("feedItems"),

  // User who created the comment
  userId: v.id("users"),

  // Comment content
  content: v.string(),

  // Parent comment ID for threaded comments
  parentCommentId: v.optional(v.id("comments")),

  // Optional media attachments
  mediaUrls: v.optional(v.array(v.string())),

  // Mentions and hashtags
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.id("users"))),
  hashtags: v.optional(v.array(v.string())),

  // Update time (creation time is automatic with _creationTime)
  updatedAt: v.optional(v.number()),

  // Soft delete fields
  deleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
})
  .index("by_feed_item", ["feedItemId"])
  .index("by_user", ["userId"])
  .index("by_parent", ["parentCommentId"])
  .index("by_mentioned_user", ["mentionedUserIds"]); // Enable querying by mentioned user

// Export the schema
export const commentsSchema = defineSchema({
  comments: commentsTable,
});

export default commentsSchema;
