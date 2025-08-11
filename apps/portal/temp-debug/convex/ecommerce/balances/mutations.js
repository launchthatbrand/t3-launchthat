import { v } from "convex/values";
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
            await ctx.db.insert("transferOrders", entry);
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
            await ctx.db.insert("transferOrders", entry);
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
        const toDelete = transferOrders.filter((to) => args.orderIds.includes(to.orderId));
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
        const bankAccount = {
            ...args,
            isDefault: args.isDefault ?? false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            address: {
                street1: "",
                city: "",
                state: "",
                postalCode: "",
                country: "US",
            },
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
        const transfer = {
            ...args,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            initiatedBy: "system", // Simplified for now
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
