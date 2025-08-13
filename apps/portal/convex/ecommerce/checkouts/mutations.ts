import { v } from "convex/values";

import { api } from "../../_generated/api";
import { mutation } from "../../_generated/server";

/**
 * Create a checkout session from a scenario-based checkout slug.
 * Falls back to legacy funnels create if needed.
 */
export const createCheckoutSession = mutation({
  args: {
    checkoutSlug: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prefer legacy implementation for session semantics while we migrate
    return await ctx.runMutation(
      api.ecommerce.funnels.mutations.createCustomCheckoutSession,
      {
        checkoutSlug: args.checkoutSlug,
        email: args.email,
        name: args.name,
      },
    );
  },
});

/**
 * Update checkout session information.
 * Currently proxies to legacy to keep behavior consistent.
 */
export const updateCheckoutSessionInfo = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
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
    return await ctx.runMutation(
      api.ecommerce.funnels.mutations.updateCustomCheckoutSessionInfo,
      args,
    );
  },
});

/**
 * Complete checkout session.
 * Currently proxies to legacy to keep behavior consistent.
 */
export const completeCheckoutSession = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
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
    return await ctx.runMutation(
      api.ecommerce.funnels.mutations.completeCustomCheckoutSession,
      args,
    );
  },
});

/**
 * Set checkout session items.
 * Currently proxies to legacy to keep behavior consistent.
 */
export const setCheckoutSessionItems = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      api.ecommerce.funnels.mutations.setCheckoutSessionItems,
      args,
    );
  },
});
