import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";
import {
  requireAdmin,
  requireAuthentication,
} from "../../lib/permissions/requirePermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";

/**
 * Get a custom checkout by slug
 */
export const getCustomCheckoutBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await getCustomCheckoutBySlugInternal(ctx, args.slug);
  },
});

/**
 * Internal function to get a custom checkout by slug
 */
async function getCustomCheckoutBySlugInternal(
  ctx: QueryCtx | MutationCtx,
  slug: string,
) {
  // Get the custom checkout by slug
  const checkout = await ctx.db
    .query("customCheckouts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  if (!checkout) {
    return null;
  }

  // Get the products for this checkout
  const products = [];
  for (const productId of checkout.productIds) {
    const product = await ctx.db.get(productId);
    if (product && product.status === "active") {
      products.push(product);
    }
  }

  return {
    ...checkout,
    products,
  };
}

/**
 * Create a custom checkout session
 */
export const createCustomCheckoutSession = mutation({
  args: {
    checkoutSlug: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the custom checkout configuration
    const checkout = await getCustomCheckoutBySlugInternal(
      ctx,
      args.checkoutSlug,
    );
    if (!checkout) {
      throw new Error(
        `Custom checkout "${args.checkoutSlug}" not found or inactive`,
      );
    }

    // Try to get authenticated user
    let userId: Id<"users"> | undefined;
    try {
      const authResult = await requireAuthentication(ctx);
      userId = authResult.userId;
    } catch (error) {
      // No authenticated user, continue with guest checkout
      userId = undefined;
    }

    // Create a cart with the products from the custom checkout
    const cartId = await ctx.db.insert("carts", {
      userId,
      items: checkout.products.map((product) => ({
        productId: product._id,
        quantity: 1,
        price: product.price,
      })),
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a custom checkout session
    const sessionId = await ctx.db.insert("customCheckoutSessions", {
      checkoutId: checkout._id,
      email: args.email,
      name: args.name,
      cartId,
      status: "active",
      currentStep: "information",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60, // Expire after 1 hour
      userId,
    });

    return {
      sessionId,
      cartId,
      checkout,
    };
  },
});

/**
 * Get a custom checkout session by ID
 */
export const getCustomCheckoutSession = query({
  args: {
    sessionId: v.id("customCheckoutSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      // Update session status to expired
      await ctx.db.patch(session._id, {
        status: "expired",
      });
      return null;
    }

    // Get the custom checkout for this session
    const checkout = session.checkoutId
      ? await ctx.db.get(session.checkoutId)
      : null;

    // Get the cart for this session
    const cart = session.cartId ? await ctx.db.get(session.cartId) : null;

    return {
      ...session,
      checkout,
      cart,
    };
  },
});

/**
 * Update a custom checkout session with customer information
 */
export const updateCustomCheckoutSessionInfo = mutation({
  args: {
    sessionId: v.id("customCheckoutSessions"),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shippingAddress: v.optional(
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

    // Get the custom checkout for this session
    const checkout = await ctx.db.get(session.checkoutId);
    if (!checkout) {
      throw new Error("Custom checkout configuration not found");
    }

    // Validate required fields based on the checkout configuration
    if (checkout.collectEmail && !args.email) {
      throw new Error("Email is required for this checkout");
    }

    if (checkout.collectName && !args.name) {
      throw new Error("Name is required for this checkout");
    }

    if (checkout.collectPhone && !args.phone) {
      throw new Error("Phone number is required for this checkout");
    }

    if (checkout.collectShippingAddress && !args.shippingAddress) {
      throw new Error("Shipping address is required for this checkout");
    }

    // Update session with customer information
    const updateData: any = {
      email: args.email,
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = args.name;
    if (args.phone) updateData.phone = args.phone;
    if (args.shippingAddress) updateData.shippingAddress = args.shippingAddress;

    // Determine the next step
    if (checkout.collectShippingAddress) {
      updateData.currentStep = "shipping";
    } else {
      updateData.currentStep = "payment";
    }

    await ctx.db.patch(args.sessionId, updateData);

    return args.sessionId;
  },
});

/**
 * Complete a custom checkout session and create an order
 */
export const completeCustomCheckoutSession = mutation({
  args: {
    sessionId: v.id("customCheckoutSessions"),
    paymentMethod: v.string(),
    paymentIntentId: v.optional(v.string()),
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

    // Get the custom checkout for this session
    const checkout = await ctx.db.get(session.checkoutId);
    if (!checkout) {
      throw new Error("Custom checkout configuration not found");
    }

    // Get the cart for this session
    const cart = await ctx.db.get(session.cartId!);
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Validate required fields based on the checkout configuration
    if (checkout.collectBillingAddress && !args.billingAddress) {
      throw new Error("Billing address is required for this checkout");
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.price * item.quantity;
    }

    // Apply any discounts from coupons here
    const discountAmount = 0; // Replace with actual discount calculation

    // Calculate tax and shipping here
    const taxAmount = 0; // Replace with actual tax calculation
    const shippingAmount = 0; // Replace with actual shipping calculation

    const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

    // Update session with payment information and totals
    const updateData: any = {
      paymentMethod: args.paymentMethod,
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      currentStep: "completed",
      status: "completed",
      updatedAt: Date.now(),
    };

    if (args.paymentIntentId) updateData.paymentIntentId = args.paymentIntentId;
    if (args.billingAddress) updateData.billingAddress = args.billingAddress;

    await ctx.db.patch(args.sessionId, updateData);

    // Create an order from this session
    const orderId = await ctx.db.insert("orders", {
      userId: session.userId,
      status: "pending",
      items: cart.items,
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      customerEmail: session.email!,
      customerName: session.name,
      customerPhone: session.phone,
      shippingAddress: session.shippingAddress,
      billingAddress: args.billingAddress || session.shippingAddress,
      paymentStatus: "paid",
      paymentMethod: args.paymentMethod,
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Mark the cart as completed
    await ctx.db.patch(cart._id, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return {
      sessionId: session._id,
      orderId,
    };
  },
});

/**
 * Get all custom checkouts (for admin)
 */
export const getAllCustomCheckouts = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    await requireAdmin(ctx);

    let query = ctx.db.query("customCheckouts");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    return await query.collect();
  },
});

/**
 * Create a new custom checkout from a content type entry
 */
export const createCustomCheckoutFromContentType = mutation({
  args: {
    contentTypeId: v.id("contentTypes"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    productIds: v.array(v.id("products")),
    collectEmail: v.boolean(),
    collectName: v.boolean(),
    collectPhone: v.optional(v.boolean()),
    collectShippingAddress: v.optional(v.boolean()),
    collectBillingAddress: v.optional(v.boolean()),
    allowCoupons: v.optional(v.boolean()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    await requireAdmin(ctx);

    // Get the authenticated user
    const user = await getAuthenticatedUser(ctx);
    const userId = user._id;

    // Check if slug is already taken
    const existing = await ctx.db
      .query("customCheckouts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(
        `A custom checkout with slug "${args.slug}" already exists`,
      );
    }

    // Validate product IDs
    for (const productId of args.productIds) {
      const product = await ctx.db.get(productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
    }

    // Create the custom checkout
    const checkoutId = await ctx.db.insert("customCheckouts", {
      contentTypeId: args.contentTypeId,
      title: args.title,
      slug: args.slug,
      description: args.description,
      productIds: args.productIds,
      collectEmail: args.collectEmail,
      collectName: args.collectName,
      collectPhone: args.collectPhone ?? false,
      collectShippingAddress: args.collectShippingAddress ?? false,
      collectBillingAddress: args.collectBillingAddress ?? false,
      allowCoupons: args.allowCoupons ?? false,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      status: args.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
    });

    return checkoutId;
  },
});

/**
 * Update a custom checkout
 */
export const updateCustomCheckout = mutation({
  args: {
    id: v.id("customCheckouts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    productIds: v.optional(v.array(v.id("products"))),
    collectEmail: v.optional(v.boolean()),
    collectName: v.optional(v.boolean()),
    collectPhone: v.optional(v.boolean()),
    collectShippingAddress: v.optional(v.boolean()),
    collectBillingAddress: v.optional(v.boolean()),
    allowCoupons: v.optional(v.boolean()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    await requireAdmin(ctx);

    // Check if checkout exists
    const checkout = await ctx.db.get(args.id);
    if (!checkout) {
      throw new Error("Custom checkout not found");
    }

    // Validate product IDs if provided
    if (args.productIds) {
      for (const productId of args.productIds) {
        const product = await ctx.db.get(productId);
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }
      }
    }

    // Update the custom checkout
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title) updateData.title = args.title;
    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.productIds) updateData.productIds = args.productIds;
    if (args.collectEmail !== undefined)
      updateData.collectEmail = args.collectEmail;
    if (args.collectName !== undefined)
      updateData.collectName = args.collectName;
    if (args.collectPhone !== undefined)
      updateData.collectPhone = args.collectPhone;
    if (args.collectShippingAddress !== undefined)
      updateData.collectShippingAddress = args.collectShippingAddress;
    if (args.collectBillingAddress !== undefined)
      updateData.collectBillingAddress = args.collectBillingAddress;
    if (args.allowCoupons !== undefined)
      updateData.allowCoupons = args.allowCoupons;
    if (args.successUrl !== undefined) updateData.successUrl = args.successUrl;
    if (args.cancelUrl !== undefined) updateData.cancelUrl = args.cancelUrl;
    if (args.status) updateData.status = args.status;

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

/**
 * Delete a custom checkout
 */
export const deleteCustomCheckout = mutation({
  args: {
    id: v.id("customCheckouts"),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    await requireAdmin(ctx);

    // Check if checkout exists
    const checkout = await ctx.db.get(args.id);
    if (!checkout) {
      throw new Error("Custom checkout not found");
    }

    // Delete the custom checkout
    await ctx.db.delete(args.id);

    return true;
  },
});
