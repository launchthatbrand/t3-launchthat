/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const commerceDiscountMutations = (components as any).launchthat_ecommerce
  .discounts.mutations;

export const createDiscountCode = mutation({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
    kind: v.union(v.literal("percent"), v.literal("fixed")),
    amount: v.number(),
    active: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      commerceDiscountMutations.createDiscountCode,
      args,
    );
  },
});

export const updateDiscountCode = mutation({
  args: {
    id: v.string(),
    code: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("percent"), v.literal("fixed"))),
    amount: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commerceDiscountMutations.updateDiscountCode, args);
    return null;
  },
});

export const deleteDiscountCode = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commerceDiscountMutations.deleteDiscountCode, args);
    return null;
  },
});

export const validateDiscountCode = mutation({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
    subtotal: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.string()),
    appliedCode: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("percent"), v.literal("fixed"))),
    amount: v.optional(v.number()),
    discountAmount: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      commerceDiscountMutations.validateDiscountCode,
      args,
    );
  },
});
