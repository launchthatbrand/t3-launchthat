import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { updateCartSummary, updateGuestCartSummary } from "./cartUtils";

/**
 * Add to cart: upsert item for user or guest session
 */
export const addToCart = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestSessionId: v.optional(v.string()),
    productId: v.id("products"),
    variationId: v.optional(v.id("productVariants")),
    quantity: v.number(),
    savedForLater: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const fetchedProduct = await ctx.db.get(args.productId);
    if (!fetchedProduct) throw new Error("Product not found");

    const product = fetchedProduct as {
      name: string;
      description?: string;
      slug?: string;
      price?: number;
      priceInCents?: number;
      sku?: string;
      images?: { url?: string }[];
    };

    const savedForLater = args.savedForLater ?? false;
    const price =
      typeof product.price === "number"
        ? product.price
        : typeof product.priceInCents === "number"
          ? product.priceInCents / 100
          : 0;

    // Try to find existing item for upsert
    let existing: Doc<"cartItems"> | null = null;
    if (args.userId) {
      existing = await ctx.db
        .query("cartItems")
        .withIndex("by_user_product", (q) =>
          q.eq("userId", `${args.userId}`).eq("productId", args.productId),
        )
        .first();
    } else if (args.guestSessionId) {
      const candidates: Doc<"cartItems">[] = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q
            .eq("guestSessionId", args.guestSessionId)
            .eq("savedForLater", false),
        )
        .collect();
      existing = candidates.find((c) => c.productId === args.productId) ?? null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("cartItems", {
        userId: args.userId ? `${args.userId}` : undefined,
        guestSessionId: args.guestSessionId,
        productId: args.productId,
        variationId: args.variationId,
        quantity: args.quantity,
        price,
        savedForLater,
        productSnapshot: {
          name: product.name,
          description: product.description,
          sku: product.sku,
          image: product.images?.[0]?.url,
          slug: product.slug,
        },
        variationSnapshot: undefined,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update summaries
    if (args.userId) {
      await updateCartSummary(ctx, `${args.userId}`);
    } else if (args.guestSessionId) {
      await updateGuestCartSummary(ctx, args.guestSessionId);
    }

    return { success: true } as const;
  },
});

export const updateCartItemQuantity = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestSessionId: v.optional(v.string()),
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
      updatedAt: Date.now(),
    });

    if (args.userId) {
      await updateCartSummary(ctx, `${args.userId}`);
    } else if (args.guestSessionId) {
      await updateGuestCartSummary(ctx, args.guestSessionId);
    }

    return { success: true } as const;
  },
});

export const removeFromCart = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestSessionId: v.optional(v.string()),
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cartItemId);

    if (args.userId) {
      await updateCartSummary(ctx, `${args.userId}`);
    } else if (args.guestSessionId) {
      await updateGuestCartSummary(ctx, args.guestSessionId);
    }

    return { success: true } as const;
  },
});

export const clearCart = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", `${args.userId}`).eq("savedForLater", false),
        )
        .collect();
      for (const item of items) await ctx.db.delete(item._id);
      await updateCartSummary(ctx, `${args.userId}`);
    } else if (args.guestSessionId) {
      const items = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q
            .eq("guestSessionId", args.guestSessionId)
            .eq("savedForLater", false),
        )
        .collect();
      for (const item of items) await ctx.db.delete(item._id);
      await updateGuestCartSummary(ctx, args.guestSessionId);
    }

    return { success: true } as const;
  },
});
