/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const commerceFunnelStepsMutations = components.launchthat_ecommerce.funnelSteps
  .mutations as any;

export const ensureDefaultFunnelSteps = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commerceFunnelStepsMutations.ensureDefaultFunnelSteps, args);
    return null;
  },
});

export const ensureBaselineStepsForFunnel = mutation({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      commerceFunnelStepsMutations.ensureBaselineStepsForFunnel,
      args,
    );
    return null;
  },
});

export const addFunnelStep = mutation({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
    kind: v.union(v.literal("checkout"), v.literal("upsell"), v.literal("thankYou")),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(commerceFunnelStepsMutations.addFunnelStep, args);
  },
});

export const ensureFunnelStepRoutingMeta = mutation({
  args: {
    stepId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commerceFunnelStepsMutations.ensureFunnelStepRoutingMeta, args);
    return null;
  },
});


