import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Feed Items table
export const feedItemsTable = defineTable({
  // Basic metadata
  contentType: v.union(
    v.literal("post"),
    v.literal("share"),
    v.literal("comment"),
  ),
  creatorId: v.id("users"),
  content: v.string(),

  // Media content
  mediaUrls: v.optional(v.array(v.string())),

  // Visibility and access control
  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("group"),
  ),

  // Reference to original content if shared
  originalContentId: v.optional(v.id("feedItems")),

  // Reference to module (blog, course, group, event)
  moduleType: v.optional(
    v.union(
      v.literal("blog"),
      v.literal("course"),
      v.literal("group"),
      v.literal("event"),
    ),
  ),
  moduleId: v.optional(v.string()),

  // Mentions and hashtags
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.id("users"))),
  hashtags: v.optional(v.array(v.string())),

  // Soft delete fields
  deleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),

  // Timestamps are automatically added by Convex (_creationTime)
})
  .index("by_creator", ["creatorId"])
  .index("by_visibility", ["visibility"])
  .index("by_module", ["moduleType", "moduleId"])
  .index("by_original_content", ["originalContentId"])
  .index("by_hashtag", ["hashtags"])
  .index("by_mentioned_user", ["mentionedUserIds"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["visibility", "moduleType", "deleted"],
  });

// Export the schema
export const feedItemsSchema = defineSchema({
  feedItems: feedItemsTable,
});

export default feedItemsSchema;
