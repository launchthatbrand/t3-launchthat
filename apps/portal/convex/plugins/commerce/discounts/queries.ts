/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

const commerceDiscountQueries = (components as any).launchthat_ecommerce
  .discounts.queries;

export const listDiscountCodes = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(commerceDiscountQueries.listDiscountCodes, args);
  },
});

export const getDiscountCodeByCode = query({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      commerceDiscountQueries.getDiscountCodeByCode,
      args,
    );
  },
});
