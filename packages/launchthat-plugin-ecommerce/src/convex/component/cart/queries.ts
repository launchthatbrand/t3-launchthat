import { v } from "convex/values";

import { query } from "../_generated/server";

export const getCart = query({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const userId = args.userId ?? undefined;
    const guestSessionId = args.guestSessionId ?? undefined;

    let items: any[] = [];
    if (userId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } else if (guestSessionId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_guest", (q: any) =>
          q.eq("guestSessionId", guestSessionId),
        )
        .order("desc")
        .collect();
    }

    return {
      items: items.map((row) => ({
        _id: row._id,
        productPostId: row.productPostId,
        variationId: row.variationId ?? null,
        quantity: row.quantity,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      subtotal: null,
      total: null,
    };
  },
});
