"use client";

import { useMutation, useQuery } from "convex/react";

import type { Id } from "@convex-config/_generated/dataModel";
import { api } from "@convex-config/_generated/api";
import { useConvexUser } from "./useConvexUser";
import { useSessionId } from "convex-helpers/react/sessions";

/**
 * Enhanced cart hook using Convex session management
 * Handles both authenticated and anonymous users with proper session tracking
 */
export const useCart = () => {
  const { convexId: userId } = useConvexUser();
  const [sessionId] = useSessionId();

  // Get cart data - automatically chooses between user and guest cart
  const queryArgs = userId
    ? { userId }
    : sessionId
      ? { guestSessionId: sessionId }
      : "skip";

  const cart = useQuery(api.ecommerce.cart.index.getCart, queryArgs);

  // Mutations for authenticated users
  const addToCartMutation = useMutation(api.ecommerce.cart.index.addToCart);
  const removeFromCartMutation = useMutation(
    api.ecommerce.cart.index.removeFromCart,
  );
  const updateCartItemMutation = useMutation(
    api.ecommerce.cart.index.updateCartItem,
  );
  const clearCartMutation = useMutation(api.ecommerce.cart.index.clearCart);

  // Mutations for guest users
  const addToGuestCartMutation = useMutation(
    api.ecommerce.cart.index.addToGuestCart,
  );
  const removeFromGuestCartMutation = useMutation(
    api.ecommerce.cart.index.removeFromGuestCart,
  );
  const updateGuestCartItemMutation = useMutation(
    api.ecommerce.cart.index.updateGuestCartItem,
  );
  const clearGuestCartMutation = useMutation(
    api.ecommerce.cart.index.clearGuestCart,
  );

  // Helper functions
  const addToCart = async (productId: Id<"products">, quantity = 1) => {
    if (userId) {
      return await addToCartMutation({ userId, productId, quantity });
    } else if (sessionId) {
      return await addToGuestCartMutation({
        guestSessionId: sessionId,
        productId,
        quantity,
      });
    } else {
      throw new Error("Unable to add to cart: no session available");
    }
  };

  const removeFromCart = async (cartItemId: Id<"cartItems">) => {
    if (userId) {
      return await removeFromCartMutation({ userId, cartItemId });
    } else if (sessionId) {
      return await removeFromGuestCartMutation({
        guestSessionId: sessionId,
        cartItemId,
      });
    } else {
      throw new Error("Unable to remove from cart: no session available");
    }
  };

  const updateCartItem = async (
    cartItemId: Id<"cartItems">,
    updates: { quantity?: number },
  ) => {
    if (userId) {
      return await updateCartItemMutation({ userId, cartItemId, updates });
    } else if (sessionId) {
      return await updateGuestCartItemMutation({
        guestSessionId: sessionId,
        cartItemId,
        updates,
      });
    } else {
      throw new Error("Unable to update cart item: no session available");
    }
  };

  const clearCart = async () => {
    if (userId) {
      return await clearCartMutation({ userId });
    } else if (sessionId) {
      return await clearGuestCartMutation({ guestSessionId: sessionId });
    } else {
      throw new Error("Unable to clear cart: no session available");
    }
  };

  const getCartCount = () => {
    return (
      cart?.items?.reduce(
        (total: number, item: any) => total + item.quantity,
        0,
      ) ?? 0
    );
  };

  const getCartTotal = () => {
    return cart?.summary?.subtotal ?? 0;
  };

  return {
    // State
    cart,
    sessionId,
    isAuthenticated: !!userId,

    // Computed values
    cartItems: cart?.items,
    savedItems: cart?.savedItems ?? [],
    cartSummary: cart?.summary ?? {
      itemCount: 0,
      subtotal: 0,
      estimatedTax: 0,
      estimatedShipping: 0,
      updatedAt: Date.now(),
    },
    cartCount: getCartCount(),
    cartTotal: getCartTotal(),

    // Actions
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
  };
};
