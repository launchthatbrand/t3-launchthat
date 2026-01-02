/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const commerceFunnelStepsQueries = components.launchthat_ecommerce.funnelSteps
  .queries as any;

export const getFunnelStepsForFunnel = query({
  args: {
    funnelId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceFunnelStepsQueries.getFunnelStepsForFunnel, args);
  },
});

export const getFunnelStepBySlug = query({
  args: {
    funnelSlug: v.string(),
    stepSlug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceFunnelStepsQueries.getFunnelStepBySlug, args);
  },
});

export const getFunnelStepById = query({
  args: {
    stepId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceFunnelStepsQueries.getFunnelStepById, args);
  },
});


