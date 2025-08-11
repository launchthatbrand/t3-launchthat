import { v } from "convex/values";
import { query } from "../../_generated/server";
/**
 * Get a single order by ID
 */
export const getOrder = query({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.orderId);
    },
});
/**
 * List orders with filters
 */
export const listOrders = query({
    args: {
        status: v.optional(v.string()),
        userId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        // Start with base query
        let ordersQuery = ctx.db.query("orders");
        // Apply user filter if provided
        if (args.userId) {
            ordersQuery = ordersQuery.filter((q) => q.eq(q.field("userId"), args.userId));
        }
        // Apply status filter if provided
        if (args.status) {
            ordersQuery = ordersQuery.filter((q) => q.eq(q.field("status"), args.status));
        }
        // Get all matching orders, then apply pagination
        const orders = await ordersQuery.collect();
        // Sort by creation time (newest first)
        orders.sort((a, b) => b._creationTime - a._creationTime);
        // Apply pagination
        const offset = args.offset ?? 0;
        const limit = args.limit ?? 50;
        return orders.slice(offset, offset + limit);
    },
});
/**
 * Get total count of orders
 */
export const getOrdersCount = query({
    args: {
        status: v.optional(v.string()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        let ordersQuery = ctx.db.query("orders");
        // Apply filters similar to listOrders
        if (args.userId) {
            ordersQuery = ordersQuery.filter((q) => q.eq(q.field("userId"), args.userId));
        }
        if (args.status) {
            ordersQuery = ordersQuery.filter((q) => q.eq(q.field("status"), args.status));
        }
        const orders = await ordersQuery.collect();
        return orders.length;
    },
});
