import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the chargebacks table
const chargebacksTable = defineTable({
  // Core chargeback details
  chargebackId: v.string(), // Unique chargeback identifier from payment processor
  orderId: v.id("orders"), // Link to the original order
  transactionId: v.optional(v.string()), // Original transaction ID

  // Chargeback information
  amount: v.number(), // Chargeback amount in cents
  currency: v.string(), // Currency code (e.g., "USD")
  reasonCode: v.string(), // Chargeback reason code from card network
  reasonDescription: v.string(), // Human-readable reason description

  // Status and lifecycle
  status: v.union(
    v.literal("received"), // Chargeback received
    v.literal("under_review"), // Being reviewed
    v.literal("accepted"), // Accepted the chargeback
    v.literal("disputed"), // Disputed the chargeback
    v.literal("won"), // Successfully disputed
    v.literal("lost"), // Lost the dispute
    v.literal("expired"), // Time to respond expired
  ),

  // Dispute information
  disputeDeadline: v.optional(v.number()), // Deadline to respond to dispute
  evidenceSubmitted: v.optional(v.boolean()), // Whether evidence was submitted
  evidenceDetails: v.optional(v.string()), // Details about evidence submitted

  // Case information
  caseId: v.optional(v.string()), // Case ID from payment processor
  processorName: v.string(), // Payment processor (e.g., "Stripe", "Authorize.Net")

  // Financial impact
  chargebackFee: v.optional(v.number()), // Fee charged by processor
  refundAmount: v.optional(v.number()), // Amount refunded if applicable

  // Customer information (snapshot)
  customerInfo: v.object({
    email: v.string(),
    name: v.string(),
    customerId: v.optional(v.string()),
  }),

  // Timestamps
  chargebackDate: v.number(), // When chargeback was initiated
  receivedDate: v.number(), // When we received notification
  resolvedDate: v.optional(v.number()), // When chargeback was resolved

  // Notes and communication
  internalNotes: v.optional(v.string()), // Internal notes for team
  customerCommunication: v.optional(v.string()), // Communication log with customer

  // Risk assessment
  riskScore: v.optional(v.number()), // Risk score (0-100)
  previousChargebacks: v.optional(v.number()), // Number of previous chargebacks from this customer

  // Metadata
  metadata: v.optional(v.any()), // Additional processor-specific data
})
  .index("by_orderId", ["orderId"])
  .index("by_status", ["status"])
  .index("by_chargebackId", ["chargebackId"])
  .index("by_processorName", ["processorName"])
  .index("by_customerEmail", ["customerInfo.email"])
  .index("by_chargebackDate", ["chargebackDate"])
  .index("by_receivedDate", ["receivedDate"]);

// Export in the format expected by ecommerce/schema/index.ts
export const chargebacksSchema = {
  chargebacks: chargebacksTable,
};
