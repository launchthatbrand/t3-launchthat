import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Socialfeed Component: Comments table
 *
 * NOTE: This component is intentionally self-contained. Foreign references (like
 * portal `users` or `posts`) are stored as strings.
 */
export const commentsTable = defineTable({
  // The entity being commented on.
  // - feedItem: parentId is a `feedItems` id (string at runtime)
  // - other types: parentId is an external id (e.g. portal post id) as string
  parentId: v.string(),
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

  // User who created the comment (portal user id / subject).
  userId: v.string(),

  // Comment content
  content: v.string(),

  // Parent comment ID for threaded comments
  parentCommentId: v.optional(v.id("comments")),

  // Optional media attachments
  mediaUrls: v.optional(v.array(v.string())),

  // Mentions and hashtags (best-effort parsing; user resolution is external)
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.string())),
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
  .index("by_mentioned_user", ["mentionedUserIds"]);

export const commentsSchema = {
  comments: commentsTable,
};


