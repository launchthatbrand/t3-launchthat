import { defineTable } from "convex/server";
import { v } from "convex/values";

export const chargebacksSchema = defineTable({
  chargebackId: v.string(),
  orderId: v.id("orders"),
  transactionId: v.optional(v.string()),
  amount: v.number(),
  currency: v.string(),
  reasonCode: v.string(),
  reasonDescription: v.string(),
  status: v.union(
    v.literal("received"),
    v.literal("under_review"),
    v.literal("accepted"),
    v.literal("disputed"),
    v.literal("won"),
    v.literal("lost"),
    v.literal("expired"),
  ),
  disputeDeadline: v.optional(v.number()),
  evidenceSubmitted: v.optional(v.boolean()),
  evidenceDetails: v.optional(v.string()),
  caseId: v.optional(v.string()),
  processorName: v.string(),
  chargebackFee: v.optional(v.number()),
  refundAmount: v.optional(v.number()),
  customerInfo: v.object({
    email: v.string(),
    name: v.string(),
    customerId: v.optional(v.string()),
  }),
  chargebackDate: v.number(),
  receivedDate: v.number(),
  resolvedDate: v.optional(v.number()),
  internalNotes: v.optional(v.string()),
  customerCommunication: v.optional(v.string()),
  riskScore: v.optional(v.number()),
  previousChargebacks: v.optional(v.number()),
  metadata: v.optional(v.any()),
})
  .index("by_status", ["status"])
  .index("by_orderId", ["orderId"])
  .index("by_processorName", ["processorName"])
  .index("by_chargebackDate", ["chargebackDate"]);

// New schema for chargeback evidence/documentation
export const chargebackEvidenceSchema = defineTable({
  chargebackId: v.id("chargebacks"),
  documentType: v.union(
    v.literal("receipt"),
    v.literal("shipping_proof"),
    v.literal("customer_communication"),
    v.literal("refund_policy"),
    v.literal("terms_of_service"),
    v.literal("product_description"),
    v.literal("customer_signature"),
    v.literal("billing_statement"),
    v.literal("transaction_history"),
    v.literal("dispute_response"),
    v.literal("other"),
  ),
  title: v.string(),
  description: v.optional(v.string()),
  fileStorageId: v.optional(v.id("_storage")), // For uploaded files
  textContent: v.optional(v.string()), // For text-based evidence
  url: v.optional(v.string()), // For external links
  processorRelevance: v.optional(
    v.object({
      stripe: v.optional(v.boolean()),
      authorizeNet: v.optional(v.boolean()),
      paypal: v.optional(v.boolean()),
      square: v.optional(v.boolean()),
    }),
  ),
  submissionStatus: v.union(
    v.literal("draft"),
    v.literal("ready"),
    v.literal("submitted"),
    v.literal("accepted"),
    v.literal("rejected"),
  ),
  submittedAt: v.optional(v.number()),
  submittedBy: v.optional(v.string()), // User ID or email
  importance: v.union(
    v.literal("critical"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
  ),
  tags: v.optional(v.array(v.string())),
  metadata: v.optional(v.any()),
})
  .index("by_chargebackId", ["chargebackId"])
  .index("by_documentType", ["documentType"])
  .index("by_submissionStatus", ["submissionStatus"])
  .index("by_importance", ["importance"]);

// Export both schemas in the format expected by ecommerce/schema/index.ts
export const chargebacksSchemaExport = {
  chargebacks: chargebacksSchema,
  chargebackEvidence: chargebackEvidenceSchema,
};
