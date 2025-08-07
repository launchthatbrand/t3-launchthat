import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define subscriptions table (from ecommerceSchemaExtended.ts)
export const subscriptionsTable = defineTable({
  // Subscription identifiers
  subscriptionId: v.string(), // Human-readable subscription ID

  // Customer information
  userId: v.id("users"),

  // Product/plan information
  productId: v.id("products"),
  planName: v.string(),
  planDescription: v.optional(v.string()),

  // Subscription terms
  interval: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("quarterly"),
    v.literal("biannually"),
    v.literal("annually"),
  ),
  intervalCount: v.number(), // e.g., 1 for monthly, 3 for quarterly
  price: v.number(), // Price per interval

  // Subscription status
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("cancelled"),
    v.literal("expired"),
    v.literal("past_due"),
    v.literal("unpaid"),
    v.literal("trial"),
  ),

  // Trial information
  trialStartDate: v.optional(v.number()),
  trialEndDate: v.optional(v.number()),

  // Dates
  startDate: v.number(), // When subscription started
  currentPeriodStart: v.number(), // Start of current billing period
  currentPeriodEnd: v.number(), // End of current billing period
  nextBillingDate: v.optional(v.number()),
  cancelledAt: v.optional(v.number()), // When cancellation was requested
  endedAt: v.optional(v.number()), // When subscription definitively ended

  // Payment information
  paymentMethodId: v.optional(v.id("paymentMethods")), // Link to saved payment method
  lastPaymentDate: v.optional(v.number()),
  lastPaymentAmount: v.optional(v.number()),

  // Administrative
  createdAt: v.number(),
  updatedAt: v.number(),

  // Metadata
  metadata: v.optional(v.any()), // For storing additional provider-specific data
})
  .index("by_user", ["userId"])
  .index("by_product", ["productId"])
  .index("by_status", ["status"])
  .index("by_next_billing_date", ["nextBillingDate"]);

export const subscriptionsSchema = {
  subscriptions: subscriptionsTable,
};
