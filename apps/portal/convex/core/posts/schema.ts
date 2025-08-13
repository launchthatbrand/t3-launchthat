import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for posts in the CMS
 */
export const postsTable = defineTable({
  title: v.string(),
  content: v.optional(v.string()),
  authorId: v.optional(v.id("users")),
  createdAt: v.optional(v.number()), // Consider adding timestamps
  updatedAt: v.optional(v.number()),
  status: v.optional(v.string()), // "published", "draft", or "archived"
  slug: v.optional(v.string()), // URL slug for the post
  tags: v.optional(v.array(v.string())), // Tags for categorization
  category: v.optional(v.string()), // Category of the post
  excerpt: v.optional(v.string()), // Short description of the post
  featuredImageUrl: v.optional(v.string()), // URL to a featured image
  featured: v.optional(v.boolean()), // Whether the post is featured
  readTime: v.optional(v.string()), // Estimated reading time
})
  .index("by_author", ["authorId"])
  .index("by_status", ["status"])
  .index("by_slug", ["slug"])
  .index("by_category", ["category"])
  .index("by_featured", ["featured"]);

export const postsSchema = {
  posts: postsTable,
};
