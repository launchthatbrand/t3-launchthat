import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define payment methods table (from ecommerceSchemaExtended.ts)
export const paymentMethodsTable = defineTable({
  userId: v.id("users"),
  type: v.union(
    v.literal("credit_card"),
    v.literal("paypal"),
    v.literal("bank_account"),
  ),
  isDefault: v.boolean(),

  // Credit card specific details
  cardBrand: v.optional(v.string()), // e.g., "Visa", "Mastercard"
  cardLast4: v.optional(v.string()),
  cardExpiryMonth: v.optional(v.number()),
  cardExpiryYear: v.optional(v.number()),

  // PayPal specific details
  paypalEmail: v.optional(v.string()),

  // Bank account specific details (masked)
  bankName: v.optional(v.string()),
  accountLast4: v.optional(v.string()),
  accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),

  // Billing address associated with this payment method
  billingAddress: v.optional(
    v.object({
      street1: v.string(),
      street2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  ),

  // Status (e.g., if card is expired or needs verification)
  status: v.optional(
    v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("requires_verification"),
    ),
  ),

  // Provider specific token or ID (e.g., Stripe PaymentMethod ID)
  providerToken: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_default", ["userId", "isDefault"])
  .index("by_user_type", ["userId", "type"]);

export const paymentMethodsSchema = {
  paymentMethods: paymentMethodsTable,
};
