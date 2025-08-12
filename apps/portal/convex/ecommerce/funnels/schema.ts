import { defineTable } from "convex/server";
import { v } from "convex/values";

const addressObject = v.object({
  fullName: v.string(),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  city: v.string(),
  stateOrProvince: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phoneNumber: v.optional(v.string()),
});

export const funnelsSchema = {
  funnels: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // draft | active | archived
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  funnelSteps: defineTable({
    funnelId: v.id("funnels"),
    slug: v.optional(v.string()),
    type: v.union(
      v.literal("landing"),
      v.literal("funnelCheckout"),
      v.literal("upsell"),
      v.literal("order_confirmation"),
    ),
    position: v.number(),
    label: v.optional(v.string()),
    config: v.optional(
      v.object({
        productIds: v.optional(v.array(v.id("products"))),
        checkoutLayout: v.optional(
          v.union(v.literal("one_step"), v.literal("two_step")),
        ),
        collectEmail: v.optional(v.boolean()),
        collectName: v.optional(v.boolean()),
        collectPhone: v.optional(v.boolean()),
        collectShippingAddress: v.optional(v.boolean()),
        collectBillingAddress: v.optional(v.boolean()),
        allowCoupons: v.optional(v.boolean()),
        successUrl: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_funnelId", ["funnelId"]) // For listing steps per funnel
    .index("by_funnelId_and_position", ["funnelId", "position"])
    .index("by_slug", ["slug"]),

  funnelSessions: defineTable({
    funnelId: v.id("funnels"),
    // Customer info
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shippingAddress: v.optional(addressObject),
    billingAddress: v.optional(addressObject),

    // Items snapshot for checkout step
    items: v.optional(
      v.array(
        v.object({
          productId: v.id("products"),
          quantity: v.number(),
          price: v.number(),
        }),
      ),
    ),

    // Payment info
    paymentMethod: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),

    // Totals
    subtotal: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    shippingAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),

    // Status
    status: v.string(), // active | completed | abandoned | expired
    currentStep: v.string(), // information | shipping | payment | completed

    // System
    userId: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_funnelId", ["funnelId"]) // For fetching sessions of a funnel
    .index("by_status", ["status"]),
};
