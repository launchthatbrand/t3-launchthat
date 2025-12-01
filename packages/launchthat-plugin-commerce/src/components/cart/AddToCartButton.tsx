"use client";

import React, { useEffect, useState } from "react";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@acme/ui/button";

import type { Id } from "../../lib/types";
import {
  useCommerceApi,
  useCommerceAuth,
  useCommerceMutation,
} from "../../context/CommerceClientProvider";

interface AddToCartButtonProps {
  productId: Id<"products">;
  variationId?: Id<"productVariants">;
  className?: string;
  showIcon?: boolean;
  quantity?: number;
}

export function AddToCartButton({
  productId,
  variationId,
  className,
  showIcon = true,
  quantity = 1,
}: AddToCartButtonProps) {
  const commerceApi = useCommerceApi<any>();
  const { userId: authUserId } = useCommerceAuth();
  const [guestSessionId, setGuestSessionId] = useState<string>("");

  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const addToCart = useCommerceMutation(commerceApi?.cart?.addToCart ?? null);
  const addToGuestCart = useCommerceMutation(
    commerceApi?.cart?.addToGuestCart ?? null,
  );

  const userId = authUserId ?? "";

  // Set up a guest session ID if no user is logged in
  useEffect(() => {
    if (!userId) {
      // Try to get an existing guest session ID from localStorage
      let sessionId = localStorage.getItem("guestCartSessionId");
      if (!sessionId) {
        // Create a new guest session ID if none exists
        sessionId = uuidv4();
        localStorage.setItem("guestCartSessionId", sessionId);
      }
      setGuestSessionId(sessionId);
    }
  }, [userId]);

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      if (userId && addToCart) {
        await addToCart({
          userId,
          productId,
          variationId,
          quantity,
        });
      } else if (guestSessionId && addToGuestCart) {
        await addToGuestCart({
          guestSessionId,
          productId,
          variationId,
          quantity,
        });
      } else if (addToGuestCart) {
        // Neither userId nor guestSessionId available - create a new guest session
        const newGuestId = uuidv4();
        localStorage.setItem("guestCartSessionId", newGuestId);
        setGuestSessionId(newGuestId);

        if (addToGuestCart) {
          await addToGuestCart({
            guestSessionId: newGuestId,
            productId,
            variationId,
            quantity,
          });
        }
      }

      // Show success state
      setIsAdded(true);

      // Reset to normal state after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert((error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || isAdded}
      className={className}
    >
      {isAdding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : isAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
          Add to Cart
        </>
      )}
    </Button>
  );
}
