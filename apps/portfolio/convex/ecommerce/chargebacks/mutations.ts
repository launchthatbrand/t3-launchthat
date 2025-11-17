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
