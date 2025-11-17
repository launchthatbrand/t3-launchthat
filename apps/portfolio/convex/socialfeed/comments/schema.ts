import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Comments table
export const commentsTable = defineTable({
  // Feed item being commented on
  parentId: v.union(
    v.id("feedItems"),
    v.id("courses"),
    v.id("lessons"),
    v.id("topics"),
    v.id("quizzes"),
    v.id("posts"),
    v.id("downloads"),
    v.id("helpdeskArticles"),
  ),
  parentType: v.union(
    v.literal("feedItem"),
    v.literal("course"),
    v.literal("lesson"),
    v.literal("topic"),
    v.literal("quiz"),
    v.literal("post"),
    v.literal("download"),
    v.literal("helpdeskArticle"),
  ),

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
  .index("by_parent", ["parentId", "parentType"])
  .index("by_user", ["userId"])
  .index("by_parentCommentId", ["parentCommentId"])
  .index("by_mentioned_user", ["mentionedUserIds"]); // Enable querying by mentioned user

// Export the schema
export const commentsSchema = {
  comments: commentsTable,
};
