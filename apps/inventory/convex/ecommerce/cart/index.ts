import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { updateCartSummary, updateGuestCartSummary } from "./cartUtils";

/**
 * Get a user's cart
 */
export const getCart = query({
  args: {
    userId: v.optional(v.string()), // Clerk User ID (optional for guests)
    guestSessionId: v.optional(v.string()), // For guest carts
  },
  handler: async (ctx, args) => {
    // If neither userId nor guestSessionId is provided, return empty cart data
    if (!args.userId && !args.guestSessionId) {
      return {
        items: [],
        savedItems: [],
        summary: {
          itemCount: 0,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          updatedAt: Date.now(),
        },
      };
    }

    let cartItems: Doc<"cartItems">[] = [];
    let savedItems: Doc<"cartItems">[] = [];
    let cartSummary: Doc<"cartSummary"> | null = null;

    if (args.userId) {
      // Case 1: Authenticated user - use userId
      // Fetch the cart items for this user (excluding saved for later items)
      cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", args.userId).eq("savedForLater", false),
        )
        .collect();

      // Fetch the saved for later items
      savedItems = await ctx.db
        .query("cartItems")
        .withIndex("by_user_saved", (q) =>
          q.eq("userId", args.userId).eq("savedForLater", true),
        )
        .collect();

      // Fetch the cart summary
      cartSummary = await ctx.db
        .query("cartSummary")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
    } else if (args.guestSessionId) {
      // Case 2: Guest user - use guestSessionId
      // Fetch the cart items for this guest (excluding saved for later items)
      cartItems = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q
            .eq("guestSessionId", args.guestSessionId)
            .eq("savedForLater", false),
        )
        .collect();

      // Fetch the saved for later items
      savedItems = await ctx.db
        .query("cartItems")
        .withIndex("by_guest_saved", (q) =>
          q.eq("guestSessionId", args.guestSessionId).eq("savedForLater", true),
        )
        .collect();

      // Fetch the cart summary
      cartSummary = await ctx.db
        .query("cartSummary")
        .withIndex("by_guestSessionId", (q) =>
          q.eq("guestSessionId", args.guestSessionId),
        )
        .first();
    }

    // If no summary exists, create a default one
    if (!cartSummary) {
      // Create default summary without database fields
      if (args.userId) {
        cartSummary = {
          userId: args.userId,
          itemCount: 0,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          updatedAt: Date.now(),
        } as unknown as Doc<"cartSummary">;
      } else if (args.guestSessionId) {
        cartSummary = {
          guestSessionId: args.guestSessionId,
          itemCount: 0,
          subtotal: 0,
          estimatedTax: 0,
          estimatedShipping: 0,
          updatedAt: Date.now(),
        } as unknown as Doc<"cartSummary">;
      }
    }

    return {
      items: cartItems,
      savedItems,
      summary: cartSummary,
    };
  },
});

/**
 * Add an item to the cart
 */
export const addToCart = mutation({
  args: {
    userId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    variationId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args) => {
    // Fetch the product to get current price and details
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with ID ${args.productId} not found`);
    }

    // Check if product has sufficient inventory
    if (
      product.stockQuantity !== undefined &&
      product.stockQuantity < args.quantity
    ) {
      throw new Error("Not enough inventory available");
    }

    // Check if variation exists if provided
    let variation = null;
    if (args.variationId) {
      variation = await ctx.db.get(args.variationId);
      if (!variation) {
        throw new Error(`Variation with ID ${args.variationId} not found`);
      }

      // Check variation inventory if applicable
      if (variation.stockQuantity < args.quantity) {
        throw new Error("Not enough inventory available for this variation");
      }
    }

    // Check if this product/variation is already in the cart
    const existingCartItem = await ctx.db
      .query("cartItems")
      .withIndex("by_user_product", (q) =>
        q.eq("userId", args.userId).eq("productId", args.productId),
      )
      .filter((q) => {
        if (args.variationId) {
          return q.eq(q.field("variationId"), args.variationId);
        } else {
          return q.eq(q.field("savedForLater"), false);
        }
      })
      .first();

    let cartItemId;

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + args.quantity;

      // Update the cart item
      cartItemId = existingCartItem._id;
      await ctx.db.patch(existingCartItem._id, {
        quantity: newQuantity,
        updatedAt: Date.now(),
      });
    } else {
      // Create a product snapshot
      const productSnapshot = {
        name: product.name,
        description: product.description,
        sku: product.sku,
        image:
          product.images && product.images.length > 0
            ? product.images[0].url
            : undefined,
        slug: product.slug,
      };

      // Create a variation snapshot if applicable
      const variationSnapshot = variation
        ? {
            name: variation.name || "Variant",
            attributes: variation.attributes || {},
          }
        : undefined;

      // Calculate the price (use salePrice if available, otherwise regular price)
      const price =
        product.salePrice !== undefined && product.salePrice > 0
          ? product.salePrice
          : product.price;

      // Create a new cart item
      cartItemId = await ctx.db.insert("cartItems", {
        userId: args.userId,
        productId: args.productId,
        variationId: args.variationId,
        quantity: args.quantity,
        price,
        savedForLater: false,
        productSnapshot,
        variationSnapshot,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update the cart summary
    await updateCartSummary(ctx, args.userId);

    return cartItemId;
  },
});

/**
 * Add an item to the guest cart
 */
export const addToGuestCart = mutation({
  args: {
    guestSessionId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
    variationId: v.optional(v.id("productVariants")),
  },
  handler: async (ctx, args) => {
    // Fetch the product to get current price and details
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error(`Product with ID ${args.productId} not found`);
    }

    // Check if product has sufficient inventory
    if (
      product.stockQuantity !== undefined &&
      product.stockQuantity < args.quantity
    ) {
      throw new Error("Not enough inventory available");
    }

    // Check if variation exists if provided
    let variation = null;
    if (args.variationId) {
      variation = await ctx.db.get(args.variationId);
      if (!variation) {
        throw new Error(`Variation with ID ${args.variationId} not found`);
      }

      // Check variation inventory if applicable
      if (variation.stockQuantity < args.quantity) {
        throw new Error("Not enough inventory available for this variation");
      }
    }

    // Check if this product/variation is already in the guest cart
    const existingCartItem = await ctx.db
      .query("cartItems")
      .withIndex("by_guest_saved", (q) =>
        q.eq("guestSessionId", args.guestSessionId).eq("savedForLater", false),
      )
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    let cartItemId;

    if (existingCartItem) {
      // Update existing cart item
      const newQuantity = existingCartItem.quantity + args.quantity;

      // Update the cart item
      cartItemId = existingCartItem._id;
      await ctx.db.patch(existingCartItem._id, {
        quantity: newQuantity,
        updatedAt: Date.now(),
      });
    } else {
      // Create a product snapshot
      const productSnapshot = {
        name: product.name,
        description: product.description,
        sku: product.sku,
        image:
          product.images && product.images.length > 0
            ? product.images[0].url
            : undefined,
        slug: product.slug,
      };

      // Create a variation snapshot if applicable
      const variationSnapshot = variation
        ? {
            name: variation.name || "Variant",
            attributes: variation.attributes || {},
          }
        : undefined;

      // Calculate the price (use salePrice if available, otherwise regular price)
      const price =
        product.salePrice !== undefined && product.salePrice > 0
          ? product.salePrice
          : product.price;

      // Create a new cart item
      cartItemId = await ctx.db.insert("cartItems", {
        guestSessionId: args.guestSessionId,
        productId: args.productId,
        variationId: args.variationId,
        quantity: args.quantity,
        price,
        savedForLater: false,
        productSnapshot,
        variationSnapshot,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update the cart summary
    await updateGuestCartSummary(ctx, args.guestSessionId);

    return cartItemId;
  },
});

/**
 * Update the quantity of a cart item
 */
export const updateCartItemQuantity = mutation({
  args: {
    cartItemId: v.id("cartItems"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) {
      throw new Error(`Cart item with ID ${args.cartItemId} not found`);
    }

    // Check product inventory
    const product = await ctx.db.get(cartItem.productId);
    if (!product) {
      throw new Error(`Product with ID ${cartItem.productId} not found`);
    }

    if (
      product.stockQuantity !== undefined &&
      product.stockQuantity < args.quantity
    ) {
      throw new Error("Not enough inventory available");
    }

    // Check variation inventory if applicable
    if (cartItem.variationId) {
      const variation = await ctx.db.get(cartItem.variationId);
      if (!variation) {
        throw new Error(`Variation with ID ${cartItem.variationId} not found`);
      }

      if (variation.stockQuantity < args.quantity) {
        throw new Error("Not enough inventory available for this variation");
      }
    }

    // Update the cart item
    await ctx.db.patch(args.cartItemId, {
      quantity: args.quantity,
      updatedAt: Date.now(),
    });

    // Update the cart summary
    if (cartItem.userId) {
      await updateCartSummary(ctx, cartItem.userId);
    } else if (cartItem.guestSessionId) {
      await updateGuestCartSummary(ctx, cartItem.guestSessionId);
    }

    return args.cartItemId;
  },
});

/**
 * Remove an item from the cart
 */
export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) {
      throw new Error(`Cart item with ID ${args.cartItemId} not found`);
    }

    // Delete the cart item
    await ctx.db.delete(args.cartItemId);

    // Update the cart summary
    if (cartItem.userId) {
      await updateCartSummary(ctx, cartItem.userId);
    } else if (cartItem.guestSessionId) {
      await updateGuestCartSummary(ctx, cartItem.guestSessionId);
    }

    return true;
  },
});

/**
 * Save an item for later
 */
export const saveForLater = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) {
      throw new Error(`Cart item with ID ${args.cartItemId} not found`);
    }

    // Update the cart item
    await ctx.db.patch(args.cartItemId, {
      savedForLater: true,
      updatedAt: Date.now(),
    });

    // Update the cart summary
    if (cartItem.userId) {
      await updateCartSummary(ctx, cartItem.userId);
    } else if (cartItem.guestSessionId) {
      await updateGuestCartSummary(ctx, cartItem.guestSessionId);
    }

    return args.cartItemId;
  },
});

/**
 * Move an item from saved to active cart
 */
export const moveToCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    const cartItem = await ctx.db.get(args.cartItemId);
    if (!cartItem) {
      throw new Error(`Cart item with ID ${args.cartItemId} not found`);
    }

    // Check product inventory
    const product = await ctx.db.get(cartItem.productId);
    if (!product) {
      throw new Error(`Product with ID ${cartItem.productId} not found`);
    }

    if (
      product.stockQuantity !== undefined &&
      product.stockQuantity < cartItem.quantity
    ) {
      throw new Error("Not enough inventory available to move to cart");
    }

    // Check variation inventory if applicable
    if (cartItem.variationId) {
      const variation = await ctx.db.get(cartItem.variationId);
      if (!variation) {
        throw new Error(`Variation with ID ${cartItem.variationId} not found`);
      }

      if (variation.stockQuantity < cartItem.quantity) {
        throw new Error("Not enough inventory available for this variation");
      }
    }

    // Update the cart item
    await ctx.db.patch(args.cartItemId, {
      savedForLater: false,
      updatedAt: Date.now(),
    });

    // Update the cart summary
    if (cartItem.userId) {
      await updateCartSummary(ctx, cartItem.userId);
    } else if (cartItem.guestSessionId) {
      await updateGuestCartSummary(ctx, cartItem.guestSessionId);
    }

    return args.cartItemId;
  },
});

/**
 * Clear all items from a user's cart
 */
export const clearCart = mutation({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
    includeSaved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.userId && !args.guestSessionId) {
      throw new Error("Either userId or guestSessionId must be provided");
    }

    // Get all cart items for this user or guest
    let cartItems: Doc<"cartItems">[] = [];

    if (args.userId) {
      // For authenticated user
      if (args.includeSaved) {
        // Delete all items including saved for later
        cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_user_product", (q) => q.eq("userId", args.userId))
          .collect();
      } else {
        // Delete only active cart items
        cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_user_saved", (q) =>
            q.eq("userId", args.userId).eq("savedForLater", false),
          )
          .collect();
      }

      // Delete all the items
      for (const item of cartItems) {
        await ctx.db.delete(item._id);
      }

      // Update the cart summary
      await updateCartSummary(ctx, args.userId);
    } else if (args.guestSessionId) {
      // For guest user
      if (args.includeSaved) {
        // Delete all items including saved for later
        cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_guest_saved", (q) =>
            q.eq("guestSessionId", args.guestSessionId),
          )
          .collect();
      } else {
        // Delete only active cart items
        cartItems = await ctx.db
          .query("cartItems")
          .withIndex("by_guest_saved", (q) =>
            q
              .eq("guestSessionId", args.guestSessionId)
              .eq("savedForLater", false),
          )
          .collect();
      }

      // Delete all the items
      for (const item of cartItems) {
        await ctx.db.delete(item._id);
      }

      // Update the cart summary
      await updateGuestCartSummary(ctx, args.guestSessionId);
    }

    return { success: true, itemsRemoved: cartItems.length };
  },
});

/**
 * Merge a guest cart into a user's cart
 */
export const mergeGuestCart = mutation({
  args: {
    userId: v.string(), // Clerk User ID
    guestSessionId: v.string(), // Guest session ID
  },
  handler: async (ctx, args) => {
    // 1. Fetch guest cart items (excluding saved for later)
    const guestItems = await ctx.db
      .query("cartItems")
      .withIndex("by_guest_saved", (q) =>
        q.eq("guestSessionId", args.guestSessionId).eq("savedForLater", false),
      )
      .collect();

    if (guestItems.length === 0) {
      // No items to merge
      return { success: true, itemsMerged: 0 };
    }

    // 2. Fetch user's current cart items
    const userItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user_saved", (q) =>
        q.eq("userId", args.userId).eq("savedForLater", false),
      )
      .collect();

    // Track how many items were merged
    let itemsMerged = 0;

    // 3. For each guest item, either add to user cart or merge with existing items
    for (const guestItem of guestItems) {
      // Check if this product/variation is already in the user's cart
      const existingItem = userItems.find(
        (item) =>
          item.productId === guestItem.productId &&
          item.variationId === guestItem.variationId,
      );

      if (existingItem) {
        // Update existing cart item - add quantities
        await ctx.db.patch(existingItem._id, {
          quantity: existingItem.quantity + guestItem.quantity,
          updatedAt: Date.now(),
        });
      } else {
        // Create a new cart item for the user based on the guest item
        await ctx.db.insert("cartItems", {
          userId: args.userId,
          productId: guestItem.productId,
          variationId: guestItem.variationId,
          quantity: guestItem.quantity,
          price: guestItem.price, // Include the price from the guest item
          productSnapshot: guestItem.productSnapshot,
          variationSnapshot: guestItem.variationSnapshot,
          savedForLater: false,
          updatedAt: Date.now(),
          addedAt: Date.now(),
        });
      }

      // Delete the guest cart item
      await ctx.db.delete(guestItem._id);
      itemsMerged++;
    }

    // 4. Also merge saved-for-later items
    const guestSavedItems = await ctx.db
      .query("cartItems")
      .withIndex("by_guest_saved", (q) =>
        q.eq("guestSessionId", args.guestSessionId).eq("savedForLater", true),
      )
      .collect();

    for (const savedItem of guestSavedItems) {
      // Create a new saved item for the user
      await ctx.db.insert("cartItems", {
        userId: args.userId,
        productId: savedItem.productId,
        variationId: savedItem.variationId,
        quantity: savedItem.quantity,
        price: savedItem.price, // Include the price from the saved item
        productSnapshot: savedItem.productSnapshot,
        variationSnapshot: savedItem.variationSnapshot,
        savedForLater: true,
        updatedAt: Date.now(),
        addedAt: Date.now(),
      });

      // Delete the guest saved item
      await ctx.db.delete(savedItem._id);
      itemsMerged++;
    }

    // 5. Delete the guest cart summary
    const guestSummary = await ctx.db
      .query("cartSummary")
      .withIndex("by_guestSessionId", (q) =>
        q.eq("guestSessionId", args.guestSessionId),
      )
      .first();

    if (guestSummary) {
      await ctx.db.delete(guestSummary._id);
    }

    // 6. Update the user's cart summary
    await updateCartSummary(ctx, args.userId);

    return { success: true, itemsMerged };
  },
});
