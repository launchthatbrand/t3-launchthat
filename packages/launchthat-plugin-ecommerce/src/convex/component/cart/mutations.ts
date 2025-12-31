import { v } from "convex/values";

import { mutation } from "../_generated/server";

const normalizeQuantity = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.floor(n), 999);
};

export const addToCart = mutation({
  args: {
    userId: v.string(),
    productPostId: v.string(),
    quantity: v.optional(v.number()),
    variationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const quantity = normalizeQuantity(args.quantity ?? 1);

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q: any) =>
        q.eq("userId", args.userId).eq("productPostId", args.productPostId),
      )
      .filter((q: any) =>
        q.eq(q.field("variationId"), args.variationId ?? undefined),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + quantity,
        updatedAt: now,
      });
      return { success: true, cartItemId: String(existing._id) };
    }

    const cartItemId = await ctx.db.insert("cartItems", {
      userId: args.userId,
      guestSessionId: undefined,
      productPostId: args.productPostId,
      variationId: args.variationId ?? undefined,
      quantity,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, cartItemId: String(cartItemId) };
  },
});

export const addToGuestCart = mutation({
  args: {
    guestSessionId: v.string(),
    productPostId: v.string(),
    quantity: v.optional(v.number()),
    variationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const now = Date.now();
    const quantity = normalizeQuantity(args.quantity ?? 1);

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_guest_product", (q: any) =>
        q.eq("guestSessionId", args.guestSessionId).eq("productPostId", args.productPostId),
      )
      .filter((q: any) =>
        q.eq(q.field("variationId"), args.variationId ?? undefined),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + quantity,
        updatedAt: now,
      });
      return { success: true, cartItemId: String(existing._id) };
    }

    const cartItemId = await ctx.db.insert("cartItems", {
      userId: undefined,
      guestSessionId: args.guestSessionId,
      productPostId: args.productPostId,
      variationId: args.variationId ?? undefined,
      quantity,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, cartItemId: String(cartItemId) };
  },
});

export const removeFromCart = mutation({
  args: {
    userId: v.string(),
    cartItemId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db.get(args.cartItemId as any);
    if (existing && existing.userId === args.userId) await ctx.db.delete(existing._id);
    return { success: true };
  },
});

export const removeFromGuestCart = mutation({
  args: {
    guestSessionId: v.string(),
    cartItemId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db.get(args.cartItemId as any);
    if (existing && existing.guestSessionId === args.guestSessionId)
      await ctx.db.delete(existing._id);
    return { success: true };
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
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db.get(args.cartItemId as any);
    if (!existing) return { success: true };

    if (args.userId && existing.userId !== args.userId) return { success: true };
    if (args.guestSessionId && existing.guestSessionId !== args.guestSessionId)
      return { success: true };

    const quantity = normalizeQuantity(args.quantity);
    await ctx.db.patch(existing._id, { quantity, updatedAt: Date.now() });
    return { success: true };
  },
});

export const clearCart = mutation({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const userId = args.userId ?? undefined;
    const guestSessionId = args.guestSessionId ?? undefined;

    const rows = userId
      ? await ctx.db
          .query("cartItems")
          .withIndex("by_user", (q: any) => q.eq("userId", userId))
          .collect()
      : guestSessionId
        ? await ctx.db
            .query("cartItems")
            .withIndex("by_guest", (q: any) => q.eq("guestSessionId", guestSessionId))
            .collect()
        : [];

    await Promise.all(rows.map((row: any) => ctx.db.delete(row._id)));
    return { success: true };
  },
});


