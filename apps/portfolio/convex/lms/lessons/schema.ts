import { defineTable } from "convex/server";
import { v } from "convex/values";

export const lessonsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  title: v.string(),
  description: v.optional(v.string()),
  wp_id: v.optional(v.float64()),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))),
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
  isPublished: v.optional(v.boolean()),
  menuOrder: v.optional(v.number()),
  courseId: v.optional(v.id("courses")),
})
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["organizationId", "courseId", "isPublished"],
  });

export const lessonSchema = {
  lessons: lessonsTable,
};
