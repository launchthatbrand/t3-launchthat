/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const commerceFunnelsQueries = components.launchthat_ecommerce.funnels.queries as any;

export const getDefaultFunnel = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceFunnelsQueries.getDefaultFunnel, args);
  },
});

export const getFunnelBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceFunnelsQueries.getFunnelBySlug, args);
  },
});


