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
        const orders = await Promise.all(orderIds.map((orderId) => ctx.db.get(orderId)));
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
