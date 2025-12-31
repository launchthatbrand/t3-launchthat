import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const postsTable = defineTable({
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  slug: v.string(),
  // Allow plugin-defined/custom statuses (e.g. orders: paid/unpaid/failed).
  status: v.string(),
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
  .index("by_post_and_key", ["postId", "key"]);

const cartItemsTable = defineTable({
  userId: v.optional(v.string()),
  guestSessionId: v.optional(v.string()),
  productPostId: v.string(),
  variationId: v.optional(v.string()),
  quantity: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_guest", ["guestSessionId"])
  .index("by_user_product", ["userId", "productPostId"])
  .index("by_guest_product", ["guestSessionId", "productPostId"]);

export default defineSchema({
  posts: postsTable,
  postsMeta: postsMetaTable,
  cartItems: cartItemsTable,
});


