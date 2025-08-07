import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get chargebacks
 */
export const getChargebacks = query({
  args: {},
  handler: async (ctx, args) => {
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chargebackId);
  },
});
