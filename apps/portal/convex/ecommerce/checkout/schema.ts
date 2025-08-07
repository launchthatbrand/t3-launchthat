import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Custom Checkouts Schema
 *
 * This schema defines custom checkout configurations that can be created
 * via the CMS. Each checkout can have its own set of products and field requirements.
 */

export const checkoutsSchema = {
  /**
   * Custom checkout configurations
   */
  customCheckouts: defineTable({
    // Reference to the content type
    contentTypeId: v.id("contentTypes"),

    // Basic info
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),

    // Products to include in this checkout
    productIds: v.array(v.id("products")),

    // Field configuration
    collectEmail: v.boolean(),
    collectName: v.boolean(),
    collectPhone: v.optional(v.boolean()),
    collectShippingAddress: v.optional(v.boolean()),
    collectBillingAddress: v.optional(v.boolean()),
    allowCoupons: v.optional(v.boolean()),

    // Redirect URLs
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),

    // Status
    status: v.string(), // "draft", "active", "archived"

    // System fields
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_contentTypeId", ["contentTypeId"]),

  /**
   * Custom checkout sessions
   * Tracks active checkout sessions for custom checkouts
   */
  customCheckoutSessions: defineTable({
    // Reference to custom checkout
    checkoutId: v.id("customCheckouts"),

    // Customer info
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Address info
    shippingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.optional(v.string()),
      }),
    ),

    billingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.optional(v.string()),
      }),
    ),

    // Payment info
    paymentMethod: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),

    // Cart info
    cartId: v.optional(v.id("carts")),

    // Pricing
    subtotal: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    shippingAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),

    // Coupon
    couponCode: v.optional(v.string()),
    couponId: v.optional(v.id("coupons")),

    // Status
    status: v.string(), // "active", "completed", "abandoned", "expired"
    currentStep: v.string(), // "information", "shipping", "payment", "review"

    // System
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  })
    .index("by_checkoutId", ["checkoutId"])
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),
};
