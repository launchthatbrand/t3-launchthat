/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

type CommerceCartQueries = { getCart: unknown };
const commerceCartQueries = (
  components as unknown as {
    launchthat_ecommerce: { cart: { queries: CommerceCartQueries } };
  }
).launchthat_ecommerce.cart.queries;

export const getCart = query({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runQuery(
      commerceCartQueries.getCart as any,
      args,
    );
    return result;
  },
});
