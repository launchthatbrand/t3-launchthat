"use client";

import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";

import { toast } from "@acme/ui/toast";

export function GuestCartMerger() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [hasCheckedCart, setHasCheckedCart] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const mergeGuestCart = useMutation(api.cart.mergeGuestCart);

  // Get guest session ID from localStorage once on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setGuestSessionId(localStorage.getItem("guestCartSessionId"));
    }
  }, []);

  // Add a query to check if guest cart has items
  const guestCartQuery = useQuery(
    api.cart.getCart,
    guestSessionId ? { guestSessionId: guestSessionId } : "skip",
  );

  useEffect(() => {
    // Only run this effect when clerk is loaded, user is signed in,
    // we haven't already checked the cart, and we have the guest session ID
    if (isLoaded && isSignedIn && !hasCheckedCart && guestSessionId) {
      // Check if the guest cart has items
      const hasItems =
        guestCartQuery?.items &&
        Array.isArray(guestCartQuery.items) &&
        guestCartQuery.items.length > 0;

      if (hasItems) {
        // Guest cart has items, merge them
        const handleMergeCart = async () => {
          try {
            // Merge the guest cart into the user's cart
            await mergeGuestCart({
              userId: user.id,
              guestSessionId,
            });

            // Remove the guest session ID from localStorage
            if (typeof window !== "undefined") {
              localStorage.removeItem("guestCartSessionId");
            }

            // Show success message
            toast("Your guest cart items have been added to your account.");
          } catch (error) {
            console.error("Error merging carts:", error);
          }
        };

        void handleMergeCart();
      } else {
        // If guest cart is empty or doesn't exist, just remove the session ID without showing a toast
        if (typeof window !== "undefined") {
          localStorage.removeItem("guestCartSessionId");
        }
      }

      // Mark that we've checked the cart
      setHasCheckedCart(true);
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    hasCheckedCart,
    mergeGuestCart,
    guestCartQuery,
    guestSessionId,
  ]);

  // This component doesn't render anything
  return null;
}
