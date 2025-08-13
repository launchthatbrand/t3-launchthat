import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get chargebacks
 */
export const getChargebacks = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("chargebacks"),
      _creationTime: v.number(),
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
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("chargebacks").order("desc").collect();
  },
});

/**
 * Get chargeback by ID
 */
export const getChargeback = query({
  args: {
    chargebackId: v.id("chargebacks"),
  },
  returns: v.union(
    v.object({
      _id: v.id("chargebacks"),
      _creationTime: v.number(),
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
      metadata: v.optional(
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chargebackId);
  },
});
