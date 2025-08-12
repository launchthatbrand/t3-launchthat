import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get cart for user or guest session
 */
export const getCart = query({
  args: {
    userId: v.optional(v.id("users")),
    guestSessionId: v.optional(v.string()),
    // Back-compat for older callers
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isUser = !!args.userId;
    const guestId = args.guestSessionId ?? args.sessionId;
    const uid = args.userId ? `${args.userId}` : undefined;

    // Fetch items
    let items: Doc<"cartItems">[] = [];
    if (isUser && uid) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", uid).eq("savedForLater", false),
        )
        .collect();
    } else if (guestId) {
      items = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q.eq("guestSessionId", guestId).eq("savedForLater", false),
        )
        .collect();
    }

    // Fetch saved items (savedForLater)
    let savedItems: Doc<"cartItems">[] = [];
    if (isUser && uid) {
      savedItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", uid).eq("savedForLater", true),
        )
        .collect();
    } else if (guestId) {
      savedItems = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q.eq("guestSessionId", guestId).eq("savedForLater", true),
        )
        .collect();
    }

    // Fetch summary
    let summary: Doc<"cartSummary"> | null = null;
    if (isUser && uid) {
      summary = await ctx.db
        .query("cartSummary")
        .withIndex("by_userId", (q) => q.eq("userId", uid))
        .first();
    } else if (guestId) {
      summary = await ctx.db
        .query("cartSummary")
        .withIndex("by_guestSessionId", (q) => q.eq("guestSessionId", guestId))
        .first();
    }

    return {
      items,
      savedItems,
      summary: summary ?? {
        itemCount: items.length,
        subtotal: items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        ),
        estimatedTax: 0,
        estimatedShipping: 0,
        updatedAt: Date.now(),
      },
    } as const;
  },
});
