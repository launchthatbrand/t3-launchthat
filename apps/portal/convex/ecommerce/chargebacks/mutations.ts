import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Update chargeback status
 */
export const updateChargebackStatus = mutation({
  args: {
    chargebackId: v.id("chargebacks"),
    status: v.union(
      v.literal("accepted"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("expired"),
      v.literal("received"),
      v.literal("under_review"),
      v.literal("disputed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chargebackId, {
      status: args.status,
    });

    return { success: true };
  },
});

/**
 * Add chargeback evidence
 */
export const addChargebackEvidence = mutation({
  args: {
    chargebackId: v.id("chargebacks"),
    evidence: v.string(),
  },
  handler: (ctx, args) => {
    // Simplified - in real implementation this would create evidence records
    return { success: true, evidence: args.evidence };
  },
});

/**
 * Create a new chargeback record for an order
 */
export const createChargeback = mutation({
  args: {
    orderId: v.id("orders"),
    transactionId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    reasonCode: v.string(),
    reasonDescription: v.string(),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      customerId: v.optional(v.string()),
    }),
    processorName: v.string(),
    chargebackFee: v.number(),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const chargebackId = await ctx.db.insert("chargebacks", {
      chargebackId: args.transactionId ?? `cb_${now}`,
      orderId: args.orderId,
      transactionId: args.transactionId,
      amount: args.amount,
      currency: args.currency,
      reasonCode: args.reasonCode,
      reasonDescription: args.reasonDescription,
      status: "received",
      disputeDeadline: undefined,
      evidenceSubmitted: false,
      processorName: args.processorName,
      chargebackFee: args.chargebackFee,
      refundAmount: undefined,
      customerInfo: args.customerInfo,
      chargebackDate: now,
      receivedDate: now,
      resolvedDate: undefined,
      internalNotes: args.internalNotes,
      customerCommunication: undefined,
      riskScore: undefined,
      previousChargebacks: undefined,
      metadata: undefined,
    });

    return {
      success: true,
      chargebackId,
    };
  },
});

export const updateChargebackDetails = mutation({
  args: {
    chargebackId: v.id("chargebacks"),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    reasonCode: v.optional(v.string()),
    reasonDescription: v.optional(v.string()),
    disputeDeadline: v.optional(v.number()),
    processorName: v.optional(v.string()),
    chargebackFee: v.optional(v.number()),
    refundAmount: v.optional(v.number()),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chargebackId, ...updates } = args;
    if (Object.keys(updates).length === 0) {
      return { success: true };
    }
    await ctx.db.patch(chargebackId, updates);
    return { success: true };
  },
});

export const deleteChargeback = mutation({
  args: { id: v.id("chargebacks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
