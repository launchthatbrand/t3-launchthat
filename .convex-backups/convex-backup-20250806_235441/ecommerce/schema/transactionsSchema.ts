import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the validator for line items, matching the one in payments/index.ts
const lineItemSchema = v.object({
  productId: v.string(),
  productName: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  totalPrice: v.number(),
});

// Define the transactions table
const transactionsTable = defineTable({
  // Core transaction details
  status: v.union(
    v.literal("pending"),
    v.literal("succeeded"),
    v.literal("failed"),
  ),
  amount: v.number(), // Total amount charged in cents
  paymentMethod: v.string(),

  // Authorize.Net specific details (Consider making these more generic or in a nested object)
  authNetTransactionId: v.optional(v.string()),
  opaqueDataDescriptor: v.optional(v.string()), // For reference/debugging
  errorMessage: v.optional(v.string()),

  // Context details
  userId: v.optional(v.id("users")), // Link to the user who made the purchase
  orderId: v.optional(v.id("orders")), // Linking to orders table
  lineItems: v.array(lineItemSchema), // Array of purchased items (contains productId)
})
  .index("by_userId", ["userId"])
  .index("by_authNetTransactionId", ["authNetTransactionId"])
  .index("by_status", ["status"]);

// Export in the format expected by ecommerce/schema/index.ts
export const transactionsSchema = {
  transactions: transactionsTable,
  // lineItemSchema is not a table, but is exported for use in other schemas if needed
  // However, typically only table definitions are spread into the main schema.
  // For now, it's co-located. If it needs to be globally available, it should be moved.
};
