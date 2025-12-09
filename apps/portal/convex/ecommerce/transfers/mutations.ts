import { v } from "convex/values";

import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create transfer
 */
export const createTransfer = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    bankAccountId: v.id("bankAccounts"),
    description: v.optional(v.string()),
    expectedArrival: v.optional(v.number()),
    notes: v.optional(v.string()),
    fees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Authentication required" });
    }

    const initiatedBy = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!initiatedBy) {
      throw new ConvexError({ message: "User not found" });
    }

    const now = Date.now();
    const processorTransferId = `tr_${now}`;

    const transferId = await ctx.db.insert("transfers", {
      transferId: processorTransferId,
      amount: args.amount,
      currency: args.currency,
      bankAccountId: args.bankAccountId,
      paymentProcessor: "Stripe",
      processorTransferId,
      status: "pending",
      initiatedAt: now,
      expectedArrival: args.expectedArrival,
      completedAt: undefined,
      fees: args.fees,
      description: args.description,
      failureReason: undefined,
      initiatedBy: initiatedBy._id,
      notes: args.notes,
    });

    return { transferId };
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
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    if (args.failureReason !== undefined) {
      updates.failureReason = args.failureReason;
    }

    await ctx.db.patch(args.transferId, updates);
    return { success: true };
  },
});

export const updateTransferDetails = mutation({
  args: {
    transferId: v.id("transfers"),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    expectedArrival: v.optional(v.number()),
    fees: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.description !== undefined) updates.description = args.description;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.expectedArrival !== undefined)
      updates.expectedArrival = args.expectedArrival;
    if (args.fees !== undefined) updates.fees = args.fees;

    await ctx.db.patch(args.transferId, updates);
    return { success: true };
  },
});

export const deleteTransfer = mutation({
  args: { transferId: v.id("transfers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.transferId);
    return { success: true };
  },
});
