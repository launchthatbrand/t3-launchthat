import { v } from "convex/values";
import { mutation } from "../../_generated/server";
/**
 * Update order status
 */
export const updateOrderStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const updates = {
            status: args.status,
            updatedAt: Date.now(),
        };
        if (args.notes) {
            updates.notes = args.notes;
        }
        await ctx.db.patch(args.orderId, updates);
    },
});
/**
 * Create a new order (simplified version)
 */
export const createOrder = mutation({
    args: {
        email: v.string(),
        userId: v.optional(v.id("users")),
        customerInfo: v.object({
            firstName: v.string(),
            lastName: v.string(),
            phone: v.optional(v.string()),
            company: v.optional(v.string()),
        }),
        items: v.array(v.object({
            productId: v.id("products"),
            quantity: v.number(),
            price: v.number(),
        })),
        totalAmount: v.number(),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        return await ctx.db.insert("orders", {
            email: args.email,
            userId: args.userId,
            customerInfo: args.customerInfo,
            items: args.items,
            totalAmount: args.totalAmount,
            status: "pending",
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    },
});
/**
 * Delete an order
 */
export const deleteOrder = mutation({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.orderId);
    },
});
