import { defineTable } from "convex/server";
import { v } from "convex/values";

export const topicsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  lessonId: v.optional(v.id("lessons")),
  title: v.string(),
  description: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))),
  wp_id: v.optional(v.float64()),
  featuredImage: v.optional(v.string()),
  featuredMedia: v.optional(
    v.union(
      v.object({
        type: v.literal("convex"),
        mediaItemId: v.id("mediaItems"),
      }),
      v.object({
        type: v.literal("vimeo"),
        vimeoId: v.string(),
        vimeoUrl: v.string(),
      }),
      v.string(),
    ),
  ),
  contentType: v.optional(
    v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
  ),
  content: v.optional(v.string()),
  order: v.optional(v.number()),
  menuOrder: v.optional(v.number()),
  isPublished: v.optional(v.boolean()),
})
  .index("by_lesson", ["lessonId"])
  .index("by_lessonId_order", ["lessonId", "order"])
  .index("by_lessonId_menuOrder", ["lessonId", "menuOrder"])
  .index("by_organization", ["organizationId"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["organizationId", "lessonId", "isPublished"],
  });

export const topicSchema = {
  topics: topicsTable,
};
