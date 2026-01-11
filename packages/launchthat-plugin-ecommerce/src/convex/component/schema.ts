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
  .index("by_post_and_key", ["postId", "key"])
  .index("by_key_and_value", ["key", "value"]);

// Simple per-organization counters (e.g. order numbers).
const sequencesTable = defineTable({
  organizationId: v.string(),
  key: v.string(),
  next: v.number(),
  updatedAt: v.number(),
}).index("by_org_and_key", ["organizationId", "key"]);

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

// Subscription plans (ecommerce-owned)
//
// NOTE: Portal stores plan ids as opaque strings (component ids),
// so this table is the source of truth for organization plan capabilities.
const plansTable = defineTable({
  // Human/stable identifier (e.g. "free", "starter", "product:abc123").
  // Previously this was a fixed union; it's now dynamic so portal-root can
  // create product-backed plans.
  name: v.string(),
  kind: v.union(v.literal("system"), v.literal("product")),
  // If kind === "product", this points at the ecommerce component post id for the product.
  productPostId: v.optional(v.string()),
  displayName: v.string(),
  description: v.string(),
  maxOrganizations: v.number(),
  priceMonthly: v.number(),
  priceYearly: v.optional(v.number()),
  features: v.optional(v.array(v.string())),
  // Portal-wide feature limits / quotas (used by portal-root for multi-tenant gating).
  limits: v.optional(
    v.object({
      discordAiDaily: v.optional(v.number()),
      supportBubbleAiDaily: v.optional(v.number()),
      crmMaxContacts: v.optional(v.number()),
    }),
  ),
  isActive: v.boolean(),
  sortOrder: v.number(),
  updatedAt: v.number(),
})
  .index("by_name", ["name"])
  .index("by_active", ["isActive"])
  .index("by_sort_order", ["sortOrder"])
  .index("by_kind", ["kind"])
  .index("by_productPostId", ["productPostId"]);

const discountCodesTable = defineTable({
  organizationId: v.union(v.string(), v.null()), // null = global code
  code: v.string(), // normalized (uppercase, trimmed)
  kind: v.union(v.literal("percent"), v.literal("fixed")),
  amount: v.number(), // percent: 0-100, fixed: currency units
  active: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_org_and_code", ["organizationId", "code"])
  .index("by_org_and_active", ["organizationId", "active"]);

export default defineSchema({
  posts: postsTable,
  postsMeta: postsMetaTable,
  sequences: sequencesTable,
  cartItems: cartItemsTable,
  plans: plansTable,
  discountCodes: discountCodesTable,
});
