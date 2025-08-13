import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create transfer
 */
export const createTransfer = mutation({
  args: {
    amount: v.number(),
    bankAccountId: v.id("bankAccounts"),
  },
  handler: () => {
    // Simplified placeholder
    return {
      transferId: `transfer_${Date.now()}`,
      status: "pending",
    };
  },
});

/**
 * Update transfer status
 */
export const updateTransferStatus = mutation({
  args: {
    transferId: v.id("transfers"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("in_transit"),
      v.literal("reversed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transferId, {
      status: args.status,
    });
    return { success: true };
  },
});
