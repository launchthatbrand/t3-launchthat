/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

interface CommerceCartMutations {
  addToCart: unknown;
  addToGuestCart: unknown;
  removeFromCart: unknown;
  removeFromGuestCart: unknown;
  updateCartItemQuantity: unknown;
  clearCart: unknown;
}
const commerceCartMutations = (
  components as unknown as {
    launchthat_ecommerce: { cart: { mutations: CommerceCartMutations } };
  }
).launchthat_ecommerce.cart.mutations;

export const addToCart = mutation({
  args: {
    userId: v.string(),
    productPostId: v.string(),
    quantity: v.number(),
    variationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.addToCart as any,
      args,
    );
    return result;
  },
});

export const addToGuestCart = mutation({
  args: {
    guestSessionId: v.string(),
    productPostId: v.string(),
    quantity: v.number(),
    variationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.addToGuestCart as any,
      args,
    );
    return result;
  },
});

export const removeFromCart = mutation({
  args: {
    userId: v.string(),
    cartItemId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.removeFromCart as any,
      args,
    );
    return result;
  },
});

export const removeFromGuestCart = mutation({
  args: {
    guestSessionId: v.string(),
    cartItemId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.removeFromGuestCart as any,
      args,
    );
    return result;
  },
});

export const updateCartItemQuantity = mutation({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
    cartItemId: v.string(),
    quantity: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.updateCartItemQuantity as any,
      args,
    );
    return result;
  },
});

export const clearCart = mutation({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      commerceCartMutations.clearCart as any,
      args,
    );
    return result;
  },
});
