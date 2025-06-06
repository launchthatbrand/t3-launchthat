import { defineTable } from "convex/server";
import { v } from "convex/values";

// Address object definition (reused in shipping/billing)
// TODO: Consider moving this to a shared/core schema if used elsewhere
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

// Define the checkoutSessions table
export const checkoutSessionsTable = defineTable({
  userId: v.optional(v.string()),
  cartId: v.optional(v.id("carts")),
  currentStep: v.string(),
  shippingAddress: v.optional(addressObject),
  billingAddress: v.optional(addressObject),
  email: v.optional(v.string()),
  paymentIntentId: v.optional(v.string()),
  orderId: v.optional(v.id("orders")),
  status: v.string(),
  subtotal: v.optional(v.number()),
  taxAmount: v.optional(v.number()),
  shippingAmount: v.optional(v.number()),
  totalAmount: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
})
  .index("by_userId", ["userId"])
  .index("by_cartId", ["cartId"])
  .index("by_status", ["status"])
  .index("by_email", ["email"]);

// Define orders table (from ecommerceSchemaExtended.ts)
export const ordersTable = defineTable({
  // Order identifiers
  orderId: v.string(), // Human-readable order ID

  // Customer information
  userId: v.optional(v.id("users")), // Linked user account (if any)
  email: v.string(), // Customer email
  customerInfo: v.object({
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
  }),

  // Order items
  items: v.array(
    v.object({
      productId: v.id("products"),
      productSnapshot: v.object({
        name: v.string(),
        description: v.string(),
        price: v.number(), // Price at time of purchase
        imageUrl: v.optional(v.string()),
      }),
      quantity: v.number(),
      variantId: v.optional(v.id("productVariants")),
      variantSnapshot: v.optional(
        v.object({
          name: v.string(),
          attributes: v.any(),
          price: v.number(), // Price at time of purchase
        }),
      ),
      lineTotal: v.number(), // Price * quantity
      // Track Monday.com IDs for line items
      mondayItemId: v.optional(v.string()), // For tracking line items as subitems in Monday
      mondayLastSynced: v.optional(v.number()),
    }),
  ),

  // Addresses (using the existing addressObject definition)
  shippingAddress: v.optional(addressObject),
  billingAddress: v.optional(addressObject),

  // Order totals
  subtotal: v.number(), // Sum of line totals
  tax: v.optional(v.number()),
  shipping: v.optional(v.number()),
  discount: v.optional(v.number()),
  total: v.number(), // Final total including tax, shipping, discounts

  // Payment information
  paymentMethod: v.union(
    v.literal("credit_card"),
    v.literal("paypal"),
    v.literal("apple_pay"),
    v.literal("google_pay"),
    v.literal("bank_transfer"),
    v.literal("crypto"),
    v.literal("other"),
  ),
  paymentStatus: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("paid"),
    v.literal("failed"),
    v.literal("refunded"),
    v.literal("partially_refunded"),
  ),
  paymentDetails: v.optional(
    v.object({
      transactionId: v.string(),
      provider: v.string(), // Payment processor
      cardLast4: v.optional(v.string()),
      cardBrand: v.optional(v.string()),
      paypalEmail: v.optional(v.string()),
    }),
  ),

  // Order status
  status: v.union(
    v.literal("pending"), // Order placed but not confirmed
    v.literal("processing"), // Confirmed and being processed
    v.literal("shipped"), // Physically shipped
    v.literal("delivered"), // Confirmed delivered
    v.literal("completed"), // Fully fulfilled (digital goods)
    v.literal("cancelled"), // Cancelled by customer or merchant
    v.literal("refunded"), // Fully refunded
    v.literal("partially_refunded"), // Partially refunded
    v.literal("on_hold"), // Manual hold
  ),

  // Fulfillment information
  fulfillment: v.optional(
    v.object({
      shippingMethod: v.string(),
      trackingNumber: v.optional(v.string()),
      trackingUrl: v.optional(v.string()),
      carrier: v.optional(v.string()),
      shippedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      digitalDelivery: v.optional(v.boolean()), // True for digital goods
    }),
  ),

  // Timestamps
  createdAt: v.number(), // When order was placed
  updatedAt: v.number(), // Last update to order
  completedAt: v.optional(v.number()), // When order was completed/fulfilled

  // Additional information
  notes: v.optional(v.string()), // Customer notes
  adminNotes: v.optional(v.string()), // Internal/admin notes

  // Coupons and discounts
  couponCode: v.optional(v.string()),
  discounts: v.optional(
    v.array(
      v.object({
        code: v.optional(v.string()),
        description: v.string(),
        amount: v.number(),
        type: v.union(v.literal("percentage"), v.literal("fixed_amount")),
      }),
    ),
  ),

  // For subscriptions
  isSubscription: v.optional(v.boolean()),
  subscriptionId: v.optional(v.id("subscriptions")),

  // Monday.com integration
  mondayItemId: v.optional(v.string()), // ID of the corresponding item in Monday.com
  mondayBoardId: v.optional(v.string()), // ID of the Monday.com board where this item exists
  mondayLastSynced: v.optional(v.number()), // Timestamp of last sync with Monday.com
  mondaySyncStatus: v.optional(v.string()), // Status of the sync: "synced", "pending", "failed"
  mondaySyncError: v.optional(v.string()), // Last error message if sync failed
  mondaySubitemsStatus: v.optional(v.string()), // Status of subitem sync: "complete", "partial", "pending", "failed"
})
  .index("by_user", ["userId"])
  .index("by_email", ["email"])
  .index("by_status", ["status"])
  .index("by_payment_status", ["paymentStatus"])
  .index("by_created", ["createdAt"])
  .index("by_subscription", ["subscriptionId"])
  // Monday.com integration indexes
  .index("by_monday_item", ["mondayItemId"])
  .index("by_monday_sync_status", ["mondaySyncStatus"])
  .index("by_monday_last_synced", ["mondayLastSynced"])
  .searchIndex("search_orders", {
    searchField: "orderId",
    filterFields: ["status", "paymentStatus"],
  });

export const ordersSchema = {
  checkoutSessions: checkoutSessionsTable,
  orders: ordersTable,
  // Note: addressObject is not a table, so not exported here directly
  // but is used by the tables above.
};
