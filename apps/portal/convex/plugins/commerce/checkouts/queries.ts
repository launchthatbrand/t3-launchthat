/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const commerceCheckoutsQueries = components.launchthat_ecommerce.checkouts
  .queries as any;

export const getCheckoutConfigById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceCheckoutsQueries.getCheckoutConfigById, args);
  },
});

export const getCheckoutConfigBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceCheckoutsQueries.getCheckoutConfigBySlug, args);
  },
});

export const getDefaultCheckoutConfig = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceCheckoutsQueries.getDefaultCheckoutConfig, args);
  },
});


