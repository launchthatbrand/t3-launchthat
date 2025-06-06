import { v } from "convex/values";

import { Id } from "../../_generated/dataModel";
import { internalQuery, mutation, query } from "../../_generated/server";
import { requirePermission } from "../../lib/permissions/requirePermission";

/**
 * Get a single order by ID (internal)
 */
export const getOrder = internalQuery({
  args: {
    id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List orders with pagination (internal)
 */
export const listOrders = internalQuery({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("orders")),
    status: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, cursor, status, userId, email, paymentStatus } = args;

    let query = ctx.db.query("orders");

    // Apply filters
    if (status) {
      query = query.withIndex("by_status", (q) => q.eq("status", status));
    } else if (userId) {
      query = query.withIndex("by_user", (q) => q.eq("userId", userId));
    } else if (email) {
      query = query.withIndex("by_email", (q) => q.eq("email", email));
    } else if (paymentStatus) {
      query = query.withIndex("by_payment_status", (q) =>
        q.eq("paymentStatus", paymentStatus),
      );
    }

    // Apply cursor for pagination if provided
    if (cursor) {
      query = query.cursor(cursor);
    }

    // Order by most recently created and take items
    const items = await query.withIndex("by_created").order("desc").take(limit);

    // Set up pagination metadata
    let nextCursor = null;
    if (items.length === limit) {
      nextCursor = items[items.length - 1]._id;
    }

    return {
      items,
      hasMore: !!nextCursor,
      nextCursor,
    };
  },
});

/**
 * Public query to get an order by ID
 */
export const get = query({
  args: {
    id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Public query to list orders with pagination
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("orders")),
    status: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { limit = 10, cursor, status, userId, email, searchTerm } = args;

    let query = ctx.db.query("orders");

    // Apply filters
    if (status) {
      query = query.withIndex("by_status", (q) => q.eq("status", status));
    } else if (userId) {
      query = query.withIndex("by_user", (q) => q.eq("userId", userId));
    } else if (email) {
      query = query.withIndex("by_email", (q) => q.eq("email", email));
    }

    // Apply search if provided
    if (searchTerm) {
      query = query.withSearchIndex("search_orders", (q) =>
        q.search("orderId", searchTerm),
      );
    }

    // Apply cursor for pagination if provided
    if (cursor) {
      query = query.cursor(cursor);
    }

    // Order by most recently created and take items
    const items = await query.withIndex("by_created").order("desc").take(limit);

    // Set up pagination metadata
    let nextCursor = null;
    if (items.length === limit) {
      nextCursor = items[items.length - 1]._id;
    }

    return {
      items,
      hasMore: !!nextCursor,
      nextCursor,
    };
  },
});

/**
 * Get count of orders for pagination
 */
export const getOrdersCount = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable specific permission check in production
    // await requirePermission(ctx, "canManageOrders");

    // Start with the base query
    let ordersQuery = ctx.db.query("orders");

    // Apply status filter if provided
    if (args.status && args.status.trim() !== "") {
      ordersQuery = ordersQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    // Apply search filter if provided - this is a simplified approach
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      // Use searchIndex if we have one defined for orders
      ordersQuery = ordersQuery.withSearchIndex("search_orders", (q) =>
        q.search("orderId", args.searchQuery!),
      );
    }

    // Count the matching orders
    const orders = await ordersQuery.collect();
    return orders.length;
  },
});

/**
 * Get recent customers who have placed orders
 */
export const getRecentCustomers = query({
  args: {
    searchQuery: v.optional(v.string()),
    skip: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable specific permission check in production
    // await requirePermission(ctx, "canManageOrders");

    // This is a simplified implementation - in a real app, you'd create a proper
    // aggregation to get customer data from orders

    // Get all orders first (this is inefficient but works for demo)
    const orders = await ctx.db.query("orders").order("desc").collect();

    // Create a map to aggregate customer data from orders
    const customerMap = new Map<
      string,
      {
        id: string;
        email: string;
        name: string;
        orderCount: number;
        totalSpent: number;
        lastOrderDate: number;
      }
    >();

    for (const order of orders) {
      if (!order.email) continue; // Skip orders without email

      // Use email as unique identifier for customer
      const customerId = order.email;

      if (!customerMap.has(customerId)) {
        // Initialize customer record
        customerMap.set(customerId, {
          id: customerId,
          email: order.email,
          name:
            (order.shippingAddress && order.shippingAddress.fullName) ||
            "Guest Customer",
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: 0,
        });
      }

      // Get customer from the map
      const customer = customerMap.get(customerId)!;

      // Update customer metrics
      customer.orderCount += 1;
      customer.totalSpent += order.total || 0;

      // Track most recent order
      if (order.createdAt > customer.lastOrderDate) {
        customer.lastOrderDate = order.createdAt;
      }
    }

    // Convert map to array
    let customers = Array.from(customerMap.values());

    // Apply search filter if provided
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const searchLower = args.searchQuery.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.email.toLowerCase().includes(searchLower) ||
          customer.name.toLowerCase().includes(searchLower),
      );
    }

    // Sort by most recent order date
    customers.sort((a, b) => b.lastOrderDate - a.lastOrderDate);

    // Apply pagination
    const skip = args.skip ?? 0;
    const limit = args.limit ?? 10;
    return customers.slice(skip, skip + limit);
  },
});

/**
 * Update order status
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Re-enable specific permission check in production
    // await requirePermission(ctx, "canManageOrders");

    // Get the order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error(`Order with ID ${args.orderId} not found`);
    }

    // Validate the status transition based on the current status
    const validStatusTransitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["completed", "cancelled"],
      completed: [], // No further transitions allowed from completed
      cancelled: ["processing"], // Allow reactivating a cancelled order
    };

    // Check if the current status has valid transitions defined
    if (!validStatusTransitions[order.status]) {
      throw new Error(`Invalid current status: ${order.status}`);
    }

    // Check if the transition is valid
    if (
      !validStatusTransitions[order.status].includes(args.status) &&
      order.status !== args.status // Allow setting same status again
    ) {
      throw new Error(
        `Invalid status transition from ${order.status} to ${args.status}`,
      );
    }

    // Update the order status
    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a new order (used by checkout process)
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
        productSnapshot: v.object({
          name: v.string(),
          description: v.string(),
          price: v.number(),
          imageUrl: v.optional(v.string()),
        }),
        quantity: v.number(),
        variantId: v.optional(v.id("productVariants")),
        variantSnapshot: v.optional(
          v.object({
            name: v.string(),
            attributes: v.any(),
            price: v.number(),
          }),
        ),
        lineTotal: v.number(),
      }),
    ),
    shippingAddress: v.object({
      fullName: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      stateOrProvince: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phoneNumber: v.optional(v.string()),
    }),
    billingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.optional(v.string()),
      }),
    ),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    shipping: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    paymentMethod: v.union(
      v.literal("credit_card"),
      v.literal("paypal"),
      v.literal("apple_pay"),
      v.literal("google_pay"),
      v.literal("bank_transfer"),
      v.literal("crypto"),
      v.literal("other"),
    ),
    paymentDetails: v.optional(
      v.object({
        transactionId: v.string(),
        provider: v.string(),
        cardLast4: v.optional(v.string()),
        cardBrand: v.optional(v.string()),
        paypalEmail: v.optional(v.string()),
      }),
    ),
    couponCode: v.optional(v.string()),
    discounts: v.optional(
      v.array(
        v.object({
          code: v.optional(v.string()),
          description: v.string(),
          amount: v.number(),
          type: v.union(v.literal("percentage"), v.literal("fixed_amount")),
        }),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Fix permission checking for guest checkout
    // For now, just use the provided userId or undefined
    const userId = args.userId;

    // Generate a human-readable order ID
    const orderPrefix = "ORD";
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderId = `${orderPrefix}-${timestamp}-${randomSuffix}`;

    // Create the order
    const newOrderId = await ctx.db.insert("orders", {
      orderId,
      userId: userId,
      email: args.email,
      customerInfo: args.customerInfo,
      items: args.items,
      shippingAddress: args.shippingAddress,
      billingAddress: args.billingAddress || args.shippingAddress,
      subtotal: args.subtotal,
      tax: args.tax || 0,
      shipping: args.shipping || 0,
      discount: args.discount || 0,
      total: args.total,
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending", // Initial payment status
      paymentDetails: args.paymentDetails,
      status: "pending", // Initial order status
      couponCode: args.couponCode,
      discounts: args.discounts,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update product inventory (decrease stock quantity)
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product && product.stockQuantity !== undefined) {
        // Update product stock
        await ctx.db.patch(item.productId, {
          stockQuantity: Math.max(0, product.stockQuantity - item.quantity),
        });
      }

      // Update variant stock if applicable
      if (item.variantId) {
        const variant = await ctx.db.get(item.variantId);
        if (variant) {
          // Update variant stock
          await ctx.db.patch(item.variantId, {
            stockQuantity: Math.max(0, variant.stockQuantity - item.quantity),
          });
        }
      }
    }

    return { orderId: newOrderId, orderNumber: orderId };
  },
});

/**
 * Get orders for the current user
 */
export const getUserOrders = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user or throw error
    const { userId } = await requirePermission(ctx, "canViewOrders");

    // Fetch orders for this user, most recent first
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Apply pagination
    const skip = args.skip ?? 0;
    const limit = args.limit ?? 10;

    return orders.slice(skip, skip + limit);
  },
});
