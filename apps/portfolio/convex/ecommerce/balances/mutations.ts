import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create junction table entries (simplified)
 */
export const createJunctionTableEntries = mutation({
  args: {
    transferId: v.id("transfers"),
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    // Create junction entries for transfer-order relationships
    const junctionEntries = args.orderIds.map((orderId) => ({
      transferId: args.transferId,
      orderId,
      createdAt: Date.now(),
    }));

    // Insert all junction entries
    for (const entry of junctionEntries) {
      await ctx.db.insert("transferOrders", {
        ...entry,
        orderAmount: 0,
        processedAt: 0,
      });
    }

    return { success: true, entriesCreated: junctionEntries.length };
  },
});

/**
 * Add orders to transfer
 */
export const addOrdersToTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    // Add the order IDs to the transfer
    const junctionEntries = args.orderIds.map((orderId) => ({
      transferId: args.transferId,
      orderId,
      createdAt: Date.now(),
    }));

    for (const entry of junctionEntries) {
      await ctx.db.insert("transferOrders", {
        ...entry,
        orderAmount: 0,
        processedAt: 0,
      });
    }

    return { success: true };
  },
});

/**
 * Remove orders from transfer
 */
export const removeOrdersFromTransfer = mutation({
  args: {
    transferId: v.id("transfers"),
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    // Remove the junction entries
    const transferOrders = await ctx.db
      .query("transferOrders")
      .withIndex("by_transfer", (q) => q.eq("transferId", args.transferId))
      .collect();

    const toDelete = transferOrders.filter((to) =>
      args.orderIds.includes(to.orderId),
    );

    for (const entry of toDelete) {
      await ctx.db.delete(entry._id);
    }

    return { success: true, entriesDeleted: toDelete.length };
  },
});

/**
 * Create bank account
 */
export const createBankAccount = mutation({
  args: {
    accountHolderName: v.string(),
    accountNumber: v.string(),
    routingNumber: v.string(),
    bankName: v.string(),
    accountType: v.union(v.literal("checking"), v.literal("savings")),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to create a bank account",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({ code: "not_found", message: "User not found" });
    }

    const now = Date.now();
    const bankAccount = {
      accountName: args.accountHolderName,
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      routingNumber: args.routingNumber,
      accountType: args.accountType,
      address: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      },
      status: "pending_verification" as const,
      isDefault: args.isDefault ?? false,
      paymentProcessor: "Stripe",
      providerAccountId: undefined,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    };

    const id = await ctx.db.insert("bankAccounts", bankAccount);
    return id;
  },
});

/**
 * Update bank account
 */
export const updateBankAccount = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    accountHolderName: v.optional(v.string()),
    bankName: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { bankAccountId, ...updates } = args;

    await ctx.db.patch(bankAccountId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create transfer
 */
export const createTransfer = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    bankAccountId: v.id("bankAccounts"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "unauthorized",
        message: "You must be signed in to create a transfer",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      throw new ConvexError({ code: "not_found", message: "User not found" });
    }

    const now = Date.now();
    const transferId = `tr_${now}`;
    const transfer = {
      transferId,
      amount: args.amount,
      currency: args.currency,
      bankAccountId: args.bankAccountId,
      paymentProcessor: "Stripe",
      status: "pending" as const,
      initiatedAt: now,
      expectedArrival: undefined as number | undefined,
      completedAt: undefined as number | undefined,
      fees: undefined as number | undefined,
      description: args.description,
      failureReason: undefined as string | undefined,
      initiatedBy: user._id,
      notes: undefined as string | undefined,
      processorTransferId: undefined as string | undefined,
    };

    const id = await ctx.db.insert("transfers", transfer);
    return id;
  },
});

/**
 * Update store balance (simplified)
 */
export const updateStoreBalance = mutation({
  args: {
    amount: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract")),
  },
  handler: async (ctx, args) => {
    await Promise.resolve();
    // This would typically update balance in a payments processor
    // For now, just return success
    return {
      success: true,
      message: `Balance ${args.operation}ed by ${args.amount}`,
    };
  },
});

/**
 * Delete bank account
 */
export const deleteBankAccount = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.bankAccountId);
    return { success: true };
  },
});
