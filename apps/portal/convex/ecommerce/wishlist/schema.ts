import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define wishlist table (from ecommerceSchemaExtended.ts)
export const wishlistTable = defineTable({
  userId: v.id("users"),
  name: v.string(), // e.g., "My Birthday List", "Christmas Ideas"
  description: v.optional(v.string()),
  isPublic: v.boolean(), // Publicly viewable or private
  shareToken: v.optional(v.string()), // For sharing private wishlists
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_public", ["userId", "isPublic"]);

// Define wishlist items table
export const wishlistItemTable = defineTable({
  wishlistId: v.id("wishlists"),
  productId: v.id("products"),
  variantId: v.optional(v.id("productVariants")),
  addedAt: v.number(),
  quantity: v.optional(v.number()), // Desired quantity
  notes: v.optional(v.string()), // Any notes about this item
  priority: v.optional(
    v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  ),
})
  .index("by_wishlist", ["wishlistId"])
  .index("by_wishlist_product", ["wishlistId", "productId", "variantId"]);

export const wishlistSchema = {
  wishlists: wishlistTable,
  wishlistItems: wishlistItemTable,
};
