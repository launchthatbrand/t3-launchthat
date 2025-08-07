import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get payment methods
 */
export const getPaymentMethods = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("paymentMethods").collect();
  },
});

/**
 * Get payment by ID
 */
export const getPayment = query({
  args: {
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    // Simplified placeholder
    return {
      paymentId: args.paymentId,
      status: "pending",
      amount: 0,
    };
  },
});
