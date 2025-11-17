import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for posts in the CMS
 */
export const postsTable = defineTable({
  title: v.string(),
  content: v.optional(v.string()),
  authorId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("organizations")),
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
  postTypeId: v.optional(v.id("postTypes")),
  postTypeSlug: v.string(),
})
  .index("by_author", ["authorId"])
  .index("by_status", ["status"])
  .index("by_slug", ["slug"])
  .index("by_organization", ["organizationId"])
  .index("by_organization_slug", ["organizationId", "slug"])
  .index("by_organization_postTypeSlug", ["organizationId", "postTypeSlug"])
  .index("by_category", ["category"])
  .index("by_featured", ["featured"])
  .index("by_postTypeSlug", ["postTypeSlug"]);

export const postMetaTable = defineTable({
  postId: v.id("posts"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_post", ["postId"])
  .index("by_post_and_key", ["postId", "key"]);

export const postsSchema = {
  posts: postsTable,
  postsMeta: postMetaTable,
};
