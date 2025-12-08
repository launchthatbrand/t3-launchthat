/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get transfer with orders
 */
export const getTransferWithOrders = query({
  args: {
    transferId: v.id("transfers"),
  },
  handler: async (ctx, args) => {
    const transfer = await ctx.db.get(args.transferId);
    if (!transfer) {
      return null;
    }

    // Get orders associated with this transfer
    const transferOrders = await ctx.db
      .query("transferOrders")
      .withIndex("by_transfer", (q) => q.eq("transferId", args.transferId))
      .collect();

    const orderIds = transferOrders.map((to) => to.orderId);
    const orders = await Promise.all(
      orderIds.map((orderId) => ctx.db.get(orderId)),
    );

    return {
      ...transfer,
      orders: orders.filter(Boolean),
    };
  },
});

/**
 * Get bank account by ID
 */
export const getBankAccount = query({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bankAccountId);
  },
});

/**
 * Get current store balance
 */
export const getStoreBalance = query({
  args: {
    storeId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("storeBalances"),
      _creationTime: v.number(),
      availableBalance: v.number(),
      pendingBalance: v.number(),
      totalBalance: v.number(),
      currency: v.string(),
      storeId: v.optional(v.string()),
      storeName: v.optional(v.string()),
      lastUpdated: v.number(),
      updatedBy: v.optional(v.id("users")),
      paymentProcessor: v.string(),
      processorAccountId: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    // Get store balance - for single store, get the first/only balance
    if (args.storeId) {
      return await ctx.db
        .query("storeBalances")
        .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
        .first();
    } else {
      // Get the main store balance (first one or null store)
      return await ctx.db.query("storeBalances").first();
    }
  },
});

/**
 * Get all transfers
 */
export const getTransfers = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_transit"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
        v.literal("reversed"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("transfers"),
      _creationTime: v.number(),
      transferId: v.string(),
      amount: v.number(),
      currency: v.string(),
      bankAccountId: v.id("bankAccounts"),
      paymentProcessor: v.string(),
      processorTransferId: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("in_transit"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
        v.literal("reversed"),
      ),
      initiatedAt: v.number(),
      expectedArrival: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      fees: v.optional(v.number()),
      description: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      initiatedBy: v.id("users"),
      notes: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      const status = args.status as
        | "pending"
        | "in_transit"
        | "completed"
        | "failed"
        | "cancelled"
        | "reversed";
      const transfers = await ctx.db
        .query("transfers")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(args.limit ?? 50);
      return transfers;
    } else {
      const transfers = await ctx.db
        .query("transfers")
        .order("desc")
        .take(args.limit ?? 50);
      return transfers;
    }
  },
});

/**
 * Get all bank accounts
 */
export const getBankAccounts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed_verification"),
        v.literal("disabled"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("bankAccounts"),
      _creationTime: v.number(),
      accountName: v.string(),
      bankName: v.string(),
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.union(v.literal("checking"), v.literal("savings")),
      address: v.object({
        street1: v.string(),
        street2: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
      status: v.union(
        v.literal("pending_verification"),
        v.literal("verified"),
        v.literal("failed_verification"),
        v.literal("disabled"),
      ),
      isDefault: v.boolean(),
      paymentProcessor: v.string(),
      providerAccountId: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("bankAccounts")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    } else {
      return await ctx.db.query("bankAccounts").collect();
    }
  },
});
