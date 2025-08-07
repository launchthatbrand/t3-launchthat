import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define coupons table (from ecommerceSchemaExtended.ts)
export const couponsTable = defineTable({
  code: v.string(), // The coupon code itself
  description: v.optional(v.string()),
  discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  discountValue: v.number(), // Percentage (e.g., 10 for 10%) or fixed amount in cents
  minimumSpend: v.optional(v.number()), // Minimum order value in cents to apply
  maximumSpend: v.optional(v.number()), // Maximum order value in cents coupon applies to
  usageLimit: v.optional(v.number()), // Total number of times coupon can be used
  usageLimitPerUser: v.optional(v.number()), // Limit per user
  timesUsed: v.number(), // How many times this coupon has been used globally
  startDate: v.optional(v.number()), // Timestamp for when coupon becomes active
  endDate: v.optional(v.number()), // Timestamp for when coupon expires
  isEnabled: v.boolean(),
  applicableProductIds: v.optional(v.array(v.id("products"))), // Specific products coupon applies to
  applicableCategoryIds: v.optional(v.array(v.id("productCategories"))), // Specific categories coupon applies to
  excludeProductIds: v.optional(v.array(v.id("products"))), // Products coupon does NOT apply to
  excludeCategoryIds: v.optional(v.array(v.id("productCategories"))), // Categories coupon does NOT apply to
  isStackable: v.optional(v.boolean()), // Can be used with other coupons
  isAutomatic: v.optional(v.boolean()), // Applied automatically if conditions met
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_code", ["code"])
  .index("by_enabled_dates", ["isEnabled", "startDate", "endDate"]);

export const couponsSchema = {
  coupons: couponsTable,
};
