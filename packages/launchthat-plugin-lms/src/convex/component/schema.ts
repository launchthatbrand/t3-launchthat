import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { progressSchema } from "./progress/schema";

const postsTable = defineTable({
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  status: v.union(
    v.literal("published"),
    v.literal("draft"),
    v.literal("archived"),
  ),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  featuredImageUrl: v.optional(v.string()),
  postTypeSlug: v.string(),
  organizationId: v.optional(v.string()),
  authorId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_postTypeSlug", ["postTypeSlug"])
  .index("by_org", ["organizationId"])
  .index("by_org_slug", ["organizationId", "slug"])
  .index("by_org_postTypeSlug", ["organizationId", "postTypeSlug"]);

const postsMetaTable = defineTable({
  postId: v.id("posts"),
  key: v.string(),
  value: v.optional(v.union(v.string(), v.number(), v.boolean(), v.null())),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_post", ["postId"])
  .index("by_post_and_key", ["postId", "key"])
  .index("by_key", ["key"])
  .index("by_key_and_postId", ["key", "postId"]);

const courseEnrollmentsTable = defineTable({
  organizationId: v.optional(v.string()),
  courseId: v.string(),
  userId: v.string(),
  status: v.union(v.literal("active"), v.literal("revoked")),
  source: v.union(v.literal("manual"), v.literal("crm_tag"), v.literal("purchase")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_course_and_user", ["courseId", "userId"])
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"]);

export default defineSchema({
  posts: postsTable,
  postsMeta: postsMetaTable,
  courseEnrollments: courseEnrollmentsTable,
  ...progressSchema,
});
