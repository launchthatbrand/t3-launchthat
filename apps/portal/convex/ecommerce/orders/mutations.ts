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
  returns: v.object({
    recordId: v.id("orders"),
    orderNumber: v.string(),
  }),
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

    const recordId = await ctx.db.insert("orders", {
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

    return { recordId, orderNumber: orderId };
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

const addressObject = v.object({
  fullName: v.string(),
  addressLine1: v.string(),
  addressLine2: v.optional(v.string()),
  city: v.string(),
  stateOrProvince: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phoneNumber: v.optional(v.string()),
});

const lineItemInput = v.object({
  id: v.string(),
  productId: v.id("products"),
  productSnapshot: v.object({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.optional(v.string()),
  }),
  quantity: v.number(),
  price: v.number(),
  lineTotal: v.number(),
  variantId: v.optional(v.id("productVariants")),
  variantSnapshot: v.optional(
    v.object({
      name: v.string(),
      attributes: v.any(),
      price: v.number(),
    }),
  ),
});

const paymentMethodValidator = v.union(
  v.literal("credit_card"),
  v.literal("paypal"),
  v.literal("apple_pay"),
  v.literal("google_pay"),
  v.literal("bank_transfer"),
  v.literal("crypto"),
  v.literal("other"),
);

export const updateOrder = mutation({
  args: {
    id: v.id("orders"),
    userId: v.optional(v.id("users")),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    billingAddress: addressObject,
    shippingAddress: addressObject,
    paymentMethod: paymentMethodValidator,
    paymentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("paid"),
        v.literal("failed"),
        v.literal("refunded"),
        v.literal("partially_refunded"),
      ),
    ),
    status: v.optional(
      v.union(
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
    ),
    lineItems: v.array(lineItemInput),
    shipping: v.optional(v.number()),
    shippingDetails: v.optional(
      v.union(
        v.object({
          method: v.string(),
          description: v.string(),
          cost: v.number(),
        }),
        v.null(),
      ),
    ),
    tax: v.optional(v.number()),
    discount: v.optional(v.number()),
    notes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    couponCode: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    differentShippingAddress: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existingOrder = await ctx.db.get(args.id);
    if (!existingOrder) {
      throw new Error("Order not found");
    }

    const subtotal = args.lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    const tax = args.tax ?? existingOrder.tax ?? 0;
    const shipping = args.shipping ?? existingOrder.shipping ?? 0;
    const discount = args.discount ?? existingOrder.discount ?? 0;
    const total = subtotal + tax + shipping - discount;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      userId: args.userId,
      email: args.email,
      customerInfo: {
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        company: args.company,
      },
      billingAddress: args.billingAddress,
      shippingAddress: args.shippingAddress,
      items: args.lineItems.map((item) => ({
        productId: item.productId,
        productSnapshot: item.productSnapshot,
        quantity: item.quantity,
        variantId: item.variantId,
        variantSnapshot: item.variantSnapshot,
        lineTotal: item.lineTotal,
      })) as Doc<"orders">["items"],
      subtotal,
      tax,
      shipping,
      shippingDetails:
        args.shippingDetails !== undefined
          ? args.shippingDetails
          : (existingOrder.shippingDetails ?? null),
      discount,
      total,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentStatus ?? existingOrder.paymentStatus,
      status: args.status ?? existingOrder.status,
      notes: args.notes ?? existingOrder.notes,
      adminNotes: args.adminNotes ?? existingOrder.adminNotes,
      couponCode: args.couponCode ?? existingOrder.couponCode,
      updatedAt: now,
      ...(args.createdAt ? { createdAt: args.createdAt } : {}),
    });

    return { success: true };
  },
});
