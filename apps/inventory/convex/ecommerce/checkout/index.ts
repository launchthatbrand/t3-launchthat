import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { requireAuthentication } from "../../lib/permissions/requirePermission";

/**
 * Get the active checkout session for a user
 */
export const getCheckoutSession = query({
  args: {
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let session;

    if (args.sessionId) {
      // If session ID is provided, use it to fetch session (guest checkout case)
      session = await ctx.db
        .query("checkoutSessions")
        .filter((q) => q.eq(q.field("status"), "active"))
        .filter((q) => q.eq(q.field("_id"), args.sessionId))
        .first();
    } else {
      // Try to get authenticated user
      try {
        const { userId } = await requireAuthentication(ctx);

        // Try to get active session for this user
        session = await ctx.db
          .query("checkoutSessions")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();
      } catch (error) {
        // No authenticated user, return null
        return null;
      }
    }

    // Check if session has expired
    if (session && session.expiresAt && session.expiresAt < Date.now()) {
      // Update session status to expired
      await ctx.db.patch(session._id, {
        status: "expired",
      });
      return null;
    }

    return session;
  },
});

/**
 * Create a new checkout session
 */
export const createCheckoutSession = mutation({
  args: {
    cartId: v.optional(v.id("carts")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user
    let userId: string | undefined;
    try {
      const authResult = await requireAuthentication(ctx);
      userId = authResult.userId;
    } catch (error) {
      // No authenticated user, continue with guest checkout
      userId = undefined;
    }

    // Validate that we have at least a cart ID for guest checkout
    if (!userId && !args.cartId) {
      throw new Error("Either user authentication or cart ID is required");
    }

    // Create a new checkout session
    const sessionId = await ctx.db.insert("checkoutSessions", {
      userId,
      cartId: args.cartId,
      currentStep: "information", // First step in checkout flow
      email: args.email,
      status: "active",
      expiresAt: Date.now() + 1000 * 60 * 60, // Expire after 1 hour
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sessionId;
  },
});

/**
 * Update checkout session with shipping information
 */
export const updateShippingInfo = mutation({
  args: {
    sessionId: v.id("checkoutSessions"),
    email: v.string(),
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
  },
  handler: async (ctx, args) => {
    // Check if session exists and is active
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Checkout session not found");
    }

    if (session.status !== "active") {
      throw new Error(`Checkout session is ${session.status}`);
    }

    // Update session with shipping information
    await ctx.db.patch(args.sessionId, {
      email: args.email,
      shippingAddress: args.shippingAddress,
      currentStep: "shipping", // Move to next step
      updatedAt: Date.now(),
    });

    return args.sessionId;
  },
});

/**
 * Update checkout session with shipping method
 */
export const updateShippingMethod = mutation({
  args: {
    sessionId: v.id("checkoutSessions"),
    shippingMethod: v.string(),
    shippingAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if session exists and is active
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Checkout session not found");
    }

    if (session.status !== "active") {
      throw new Error(`Checkout session is ${session.status}`);
    }

    // Update session with shipping method
    await ctx.db.patch(args.sessionId, {
      shippingMethod: args.shippingMethod,
      shippingAmount: args.shippingAmount,
      currentStep: "payment", // Move to next step
      updatedAt: Date.now(),
    });

    return args.sessionId;
  },
});

/**
 * Update checkout session with payment information
 */
export const updatePaymentInfo = mutation({
  args: {
    sessionId: v.id("checkoutSessions"),
    paymentMethod: v.string(),
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
    taxAmount: v.optional(v.number()),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if session exists and is active
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Checkout session not found");
    }

    if (session.status !== "active") {
      throw new Error(`Checkout session is ${session.status}`);
    }

    // Default to shipping address if billing address not provided
    const billingAddress = args.billingAddress || session.shippingAddress;

    // Update session with payment information
    await ctx.db.patch(args.sessionId, {
      paymentMethod: args.paymentMethod,
      billingAddress,
      subtotal: args.subtotal,
      taxAmount: args.taxAmount ?? 0,
      totalAmount: args.totalAmount,
      currentStep: "review", // Move to next step
      updatedAt: Date.now(),
    });

    return args.sessionId;
  },
});

/**
 * Complete the checkout and create an order
 */
export const completeCheckout = mutation({
  args: {
    sessionId: v.id("checkoutSessions"),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if session exists and is active
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Checkout session not found");
    }

    if (session.status !== "active") {
      throw new Error(`Checkout session is ${session.status}`);
    }

    // Validate that we have all required information
    if (!session.email || !session.shippingAddress) {
      throw new Error("Missing required checkout information");
    }

    // Get cart items
    let cartItems = [];
    let userId: Id<"users"> | undefined;

    if (session.cartId) {
      // Get cart items from the cart ID
      const cart = await ctx.db.get(session.cartId);
      if (!cart) {
        throw new Error("Cart not found");
      }

      // Extract cart items and convert to order items
      cartItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        // Other fields will be populated from product/variant data
      }));

      userId = cart.userId;
    } else if (session.userId) {
      // Get cart items from the user's active cart
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", session.userId).eq("savedForLater", false),
        )
        .collect();

      cartItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variationId,
        // Other fields will be populated from product/variant data
      }));
    }

    // Calculate order totals
    const subtotal = session.subtotal ?? 0;
    const taxAmount = session.taxAmount ?? 0;
    const shippingAmount = session.shippingAmount ?? 0;
    const totalAmount =
      session.totalAmount ?? subtotal + taxAmount + shippingAmount;

    // Extract customer information from shipping address
    const [firstName, ...lastNameParts] =
      session.shippingAddress.fullName.split(" ");
    const lastName = lastNameParts.join(" ");

    // Create order
    const orderData = {
      email: session.email,
      userId,
      customerInfo: {
        firstName,
        lastName,
        phone: session.shippingAddress.phoneNumber,
      },
      shippingAddress: session.shippingAddress,
      billingAddress: session.billingAddress ?? session.shippingAddress,
      items: [], // Will be populated with product data
      subtotal,
      tax: taxAmount,
      shipping: shippingAmount,
      total: totalAmount,
      paymentMethod: session.paymentMethod ?? "credit_card",
      paymentStatus: "pending",
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Populate order items with product data
    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      let variant;
      if (item.variantId) {
        variant = await ctx.db.get(item.variantId);
      }

      // Create product snapshot
      const productSnapshot = {
        name: product.name,
        description: product.description ?? "",
        price: variant?.price ?? product.price,
        imageUrl: product.images?.[0]?.url,
      };

      // Create variant snapshot if applicable
      const variantSnapshot = variant
        ? {
            name: variant.name ?? "Variant",
            attributes: variant.attributes,
            price: variant.price ?? product.price,
          }
        : undefined;

      // Calculate line total
      const linePrice = variant?.price ?? product.price;
      const lineTotal = linePrice * item.quantity;

      // Add to order items
      orderData.items.push({
        productId: item.productId,
        productSnapshot,
        quantity: item.quantity,
        variantId: item.variantId,
        variantSnapshot,
        lineTotal,
      });
    }

    // Create the order
    const orderId = await ctx.db.insert("orders", orderData);

    // Update checkout session with order ID and status
    await ctx.db.patch(args.sessionId, {
      orderId,
      paymentIntentId: args.paymentIntentId,
      status: "completed",
      currentStep: "confirmation",
      updatedAt: Date.now(),
    });

    // Clear the cart
    if (session.cartId) {
      // Update cart to mark checkout started
      await ctx.db.patch(session.cartId, {
        checkoutStartedAt: Date.now(),
      });
    } else if (session.userId) {
      // Clear the user's cart items (keep saved for later items)
      const cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", session.userId).eq("savedForLater", false),
        )
        .collect();

      for (const item of cartItems) {
        await ctx.db.delete(item._id);
      }
    }

    return {
      orderId,
      checkoutSession: args.sessionId,
    };
  },
});
