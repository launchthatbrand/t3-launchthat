import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";

/**
 * Update order status
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("partially_refunded"),
      v.literal("on_hold"),
      v.literal("chargeback"),
    ),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    const updates: Partial<Doc<"orders">> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }

    if (args.status === "completed" || args.status === "delivered") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.orderId, updates);
    return null;
  },
});

/**
 * Create a new order (builds required order item snapshots)
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
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        price: v.number(),
      }),
    ),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Build items to match orders schema (with snapshots and line totals)
    const builtItems: Doc<"orders">["items"] =
      [] as unknown as Doc<"orders">["items"];
    let subtotal = 0;

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId as Id<"products">);
      if (!product) {
        throw new Error("Product not found");
      }

      const price = item.price;
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      builtItems.push({
        productId: item.productId,
        productSnapshot: {
          name: product.name,
          description: product.description ?? "",
          price,
          imageUrl: undefined,
        },
        quantity: item.quantity,
        variantId: undefined,
        variantSnapshot: undefined,
        lineTotal,
      } as unknown as Doc<"orders">["items"][number]);
    }

    const orderId = `ORD-${timestamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await ctx.db.insert("orders", {
      orderId,
      email: args.email,
      userId: args.userId,
      customerInfo: args.customerInfo,
      items: builtItems,
      subtotal,
      total: args.totalAmount,
      status: "pending",
      paymentMethod: "other",
      paymentStatus: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: args.notes,
    } as unknown as Doc<"orders">);
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
