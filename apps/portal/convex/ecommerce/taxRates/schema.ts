import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define tax rates table (from ecommerceSchemaExtended.ts)
export const taxRatesTable = defineTable({
  name: v.string(), // e.g., "CA Sales Tax", "VAT UK"
  rate: v.number(), // Percentage, e.g., 0.0825 for 8.25%
  country: v.string(),
  state: v.optional(v.string()),
  postalCode: v.optional(v.string()), // Can be a specific code or a wildcard pattern
  city: v.optional(v.string()),
  isCompound: v.boolean(), // Is this tax compounded on other taxes?
  priority: v.optional(v.number()), // For multiple matching taxes, higher priority wins
  isEnabled: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_country_state_postal", ["country", "state", "postalCode"])
  .index("by_enabled", ["isEnabled"]);

export const taxRatesSchema = {
  taxRates: taxRatesTable,
};
