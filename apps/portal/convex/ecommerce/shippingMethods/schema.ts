import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define shipping methods table (from ecommerceSchemaExtended.ts)
export const shippingMethodsTable = defineTable({
  name: v.string(), // e.g., "Standard Shipping", "Express Shipping"
  description: v.optional(v.string()),
  carrier: v.optional(v.string()), // e.g., "USPS", "FedEx", "DHL"
  serviceLevel: v.optional(v.string()), // e.g., "Ground", "Next Day Air"
  cost: v.number(), // Cost in cents
  minDeliveryDays: v.optional(v.number()),
  maxDeliveryDays: v.optional(v.number()),
  isEnabled: v.boolean(),
  regions: v.optional(
    v.array(
      v.object({
        country: v.string(),
        states: v.optional(v.array(v.string())), // Applicable states/provinces
        postalCodes: v.optional(v.array(v.string())), // Applicable postal codes/ranges
      }),
    ),
  ),
  weightLimitKg: v.optional(v.number()),
  dimensionsLimitCm: v.optional(
    v.object({
      length: v.number(),
      width: v.number(),
      height: v.number(),
    }),
  ),
  requiresSignature: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_enabled", ["isEnabled"]);

export const shippingMethodsSchema = {
  shippingMethods: shippingMethodsTable,
};
