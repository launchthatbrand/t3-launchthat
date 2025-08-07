import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for cart-related tables
 */

export const cartSchema = {
  /**
   * Cart items table - stores items added to user or guest carts
   */
  cartItems: defineTable({
    // User identification - either userId or guestSessionId
    userId: v.optional(v.string()), // Clerk User ID
    guestSessionId: v.optional(v.string()), // Guest session ID for non-authenticated users

    // Product information
    productId: v.id("products"),
    variationId: v.optional(v.id("productVariants")),
    quantity: v.number(),
    price: v.number(), // Price at the time of adding to cart

    // Status flags
    savedForLater: v.boolean(), // Whether this item is saved for later

    // Product snapshot (for display even if product is later modified)
    productSnapshot: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      sku: v.optional(v.string()),
      image: v.optional(v.string()), // URL to product image
      slug: v.optional(v.string()),
    }),

    // Variation snapshot (if a specific variation was selected)
    variationSnapshot: v.optional(
      v.object({
        name: v.string(),
        attributes: v.record(v.string(), v.string()),
      }),
    ),

    // Timestamps
    addedAt: v.number(), // When the item was first added to the cart
    updatedAt: v.number(), // When the item was last updated
  })
    // Indexes
    .index("by_user_saved", ["userId", "savedForLater"])
    .index("by_guest_saved", ["guestSessionId", "savedForLater"])
    .index("by_user_product", ["userId", "productId"]),

  /**
   * Cart summary table - stores cart totals and other summary information
   */
  cartSummary: defineTable({
    // User identification - either userId or guestSessionId
    userId: v.optional(v.string()), // Clerk User ID
    guestSessionId: v.optional(v.string()), // Guest session ID for non-authenticated users

    // Summary information
    itemCount: v.number(), // Number of items in the cart
    subtotal: v.number(), // Subtotal of all items (before tax and shipping)
    estimatedTax: v.number(), // Estimated tax amount
    estimatedShipping: v.number(), // Estimated shipping cost

    // Timestamps
    updatedAt: v.number(), // When the summary was last updated
  })
    // Indexes
    .index("by_userId", ["userId"])
    .index("by_guestSessionId", ["guestSessionId"]),
};
