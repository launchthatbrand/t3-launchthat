import { defineTable } from "convex/server";
import { v } from "convex/values";

// Store balance tracking
export const storeBalancesTable = defineTable({
  // Balance information
  availableBalance: v.number(), // Available balance in cents
  pendingBalance: v.number(), // Pending balance in cents (e.g., pending transfers)
  totalBalance: v.number(), // Total balance (available + pending) in cents
  currency: v.string(), // Currency code (e.g., "USD")

  // Store information
  storeId: v.optional(v.string()), // Store identifier (if multi-store)
  storeName: v.optional(v.string()),

  // Last update info
  lastUpdated: v.number(), // Timestamp of last balance update
  updatedBy: v.optional(v.id("users")), // Admin who last updated

  // Metadata
  paymentProcessor: v.string(), // "Stripe", "Authorize.Net", etc.
  processorAccountId: v.optional(v.string()), // Account ID with payment processor
})
  .index("by_store", ["storeId"])
  .index("by_processor", ["paymentProcessor"]);

// Bank account information for transfers
export const bankAccountsTable = defineTable({
  // Account identification
  accountName: v.string(), // Account holder name
  bankName: v.string(), // Bank name
  accountNumber: v.string(), // Encrypted/masked account number
  routingNumber: v.string(), // Bank routing number
  accountType: v.union(v.literal("checking"), v.literal("savings")),

  // Address information
  address: v.object({
    street1: v.string(),
    street2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    postalCode: v.string(),
    country: v.string(),
  }),

  // Status and verification
  status: v.union(
    v.literal("pending_verification"),
    v.literal("verified"),
    v.literal("failed_verification"),
    v.literal("disabled"),
  ),
  isDefault: v.boolean(), // Default account for transfers

  // Provider information
  paymentProcessor: v.string(), // Which processor this account is linked to
  providerAccountId: v.optional(v.string()), // Account ID in payment processor

  // Metadata
  createdBy: v.id("users"), // Admin who added this account
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_processor", ["paymentProcessor"])
  .index("by_default", ["isDefault"])
  .index("by_status", ["status"]);

// Transfer history
export const transfersTable = defineTable({
  // Transfer identification
  transferId: v.string(), // Unique transfer ID

  // Amount and currency
  amount: v.number(), // Transfer amount in cents
  currency: v.string(), // Currency code

  // Transfer details
  bankAccountId: v.id("bankAccounts"), // Destination bank account
  paymentProcessor: v.string(), // Processor handling the transfer
  processorTransferId: v.optional(v.string()), // Transfer ID from processor

  // Status tracking
  status: v.union(
    v.literal("pending"),
    v.literal("in_transit"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled"),
    v.literal("reversed"),
  ),

  // Timing
  initiatedAt: v.number(), // When transfer was initiated
  expectedArrival: v.optional(v.number()), // Expected arrival date
  completedAt: v.optional(v.number()), // When transfer completed

  // Fees and details
  fees: v.optional(v.number()), // Transfer fees in cents
  description: v.optional(v.string()), // Transfer description
  failureReason: v.optional(v.string()), // Reason for failure (if failed)

  // Metadata
  initiatedBy: v.id("users"), // Admin who initiated the transfer
  notes: v.optional(v.string()), // Internal notes
})
  .index("by_status", ["status"])
  .index("by_bank_account", ["bankAccountId"])
  .index("by_processor", ["paymentProcessor"])
  .index("by_date", ["initiatedAt"]);

// Junction table for many-to-many relationship between transfers and orders
export const transferOrdersTable = defineTable({
  transferId: v.id("transfers"), // Reference to the transfer
  orderId: v.id("orders"), // Reference to the order

  // Optional metadata about this relationship
  orderAmount: v.number(), // Amount contributed by this order to the transfer (in cents)
  processedAt: v.number(), // When this order was included in the transfer

  // Optional metadata
  notes: v.optional(v.string()), // Any notes about this order in the transfer
})
  .index("by_transfer", ["transferId"])
  .index("by_order", ["orderId"])
  .index("by_transfer_and_order", ["transferId", "orderId"]); // Composite index for uniqueness

export const balancesSchema = {
  storeBalances: storeBalancesTable,
  bankAccounts: bankAccountsTable,
  transfers: transfersTable,
  transferOrders: transferOrdersTable,
};
