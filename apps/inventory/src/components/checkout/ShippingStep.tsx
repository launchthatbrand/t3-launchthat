"use client";

import type { AddressData } from "@/store/checkoutStore";
import { AddressForm } from "./AddressForm";
import type { Id } from "@/convex/_generated/dataModel"; // Import Id
import { api } from "@/convex/_generated/api";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useMutation } from "convex/react";
import { useState } from "react";

export const ShippingStep = () => {
  const {
    shippingAddress,
    setShippingAddress,
    setCurrentStep,
    checkoutId,
    setCheckoutId,
  } = useCheckoutStore();

  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckoutMutation = useMutation(
    api.ecommerce.checkout.initiateCheckout as any,
  );
  const updateShippingAddressMutation = useMutation(
    api.ecommerce.checkout.updateShippingAddress as any,
  );

  const handleShippingSubmit = async (data: AddressData) => {
    setIsLoading(true);
    try {
      let currentCheckoutId = checkoutId;

      if (!currentCheckoutId) {
        // TODO: Replace with actual cartId from cart store/context
        // This is a placeholder for fetching the cart. In a real app, use a proper cart store.
        const cart = await new Promise<{ _id: Id<"cartSummary"> } | null>(
          (resolve) => {
            // Simulate fetching cart and resolve with a dummy cartId for now
            // Replace this with actual logic to get the cartId from your cart store/context
            // For example: const cartIdFromStore = useCartStore.getState().cartId;
            // if (cartIdFromStore) resolve({ _id: cartIdFromStore as Id<"cartSummary"> });
            // else resolve(null);
            const tempCartId = "temp_cart_id_placeholder" as Id<"cartSummary">; // This cast is unsafe for real use
            resolve({ _id: tempCartId });
          },
        );

        if (!cart?._id) {
          console.error("Cart not found. Cannot initiate checkout.");
          // Consider showing a user-facing error message here
          setIsLoading(false);
          return;
        }
        currentCheckoutId = (await initiateCheckoutMutation({
          cartId: cart._id,
        })) as Id<"checkoutSessions">;
        setCheckoutId(currentCheckoutId);
      }

      if (!currentCheckoutId) {
        // Double check after potential initiation
        console.error(
          "Checkout ID is still not available after initiation attempt.",
        );
        setIsLoading(false);
        return;
      }

      await updateShippingAddressMutation({
        checkoutId: currentCheckoutId as Id<"checkoutSessions">, // Cast to correct type
        address: data,
      });
      setShippingAddress(data);
      setCurrentStep("billing");
      console.log("Shipping address saved"); // Placeholder for toast
    } catch (error) {
      console.error("Failed to save shipping address:", error);
      // Consider showing a user-facing error message here
    }
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Shipping Information</h2>
      <AddressForm
        onSubmit={handleShippingSubmit}
        defaultValues={shippingAddress ?? undefined}
        isLoading={isLoading}
        submitButtonText="Continue to Billing"
      />
    </div>
  );
};
