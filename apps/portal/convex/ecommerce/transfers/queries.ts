import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get transfers
 */
export const getTransfers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("transfers").order("desc").collect();
  },
});

/**
 * Get transfer by ID
 */
export const getTransfer = query({
  args: {
    transferId: v.id("transfers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transferId);
  },
});

export const getTransferDetails = query({
  args: { transferId: v.id("transfers") },
  handler: async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) {
      return null;
    }
    const bankAccount = await ctx.db.get(transfer.bankAccountId);
    return { ...transfer, bankAccount };
  },
});
