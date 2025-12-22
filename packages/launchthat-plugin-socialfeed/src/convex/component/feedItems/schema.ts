import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Socialfeed Component: Feed Items table
 *
 * NOTE: This component is intentionally self-contained. The `creatorId` is stored
 * as a string (portal user id / subject).
 */
export const feedItemsTable = defineTable({
  contentType: v.union(
    v.literal("post"),
    v.literal("share"),
    v.literal("comment"),
  ),
  creatorId: v.string(),
  content: v.string(),

  mediaUrls: v.optional(v.array(v.string())),

  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("group"),
  ),

  originalContentId: v.optional(v.id("feedItems")),

  moduleType: v.optional(
    v.union(
      v.literal("blog"),
      v.literal("course"),
      v.literal("group"),
      v.literal("event"),
    ),
  ),
  moduleId: v.optional(v.string()),

  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.string())),
  hashtags: v.optional(v.array(v.string())),

  deleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
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

export const feedItemsSchema = {
  feedItems: feedItemsTable,
};


