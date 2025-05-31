import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { useConvexMutation, useConvexQuery } from "./convex";

/**
 * Hook for working with custom checkouts
 */
export function useCustomCheckout() {
  const router = useRouter();

  // Mutations
  const createCheckoutSession = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.createCustomCheckoutSession,
  );
  const updateCheckoutInfo = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.updateCustomCheckoutSessionInfo,
  );
  const completeCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.completeCustomCheckoutSession,
  );

  /**
   * Fetch a custom checkout by slug
   */
  const getCheckoutBySlug = useCallback((slug: string) => {
    return useConvexQuery(
      api.ecommerce.checkout.customCheckouts.getCustomCheckoutBySlug,
      { slug },
    );
  }, []);

  /**
   * Initialize a custom checkout session
   */
  const initializeCheckout = useCallback(
    async (
      checkoutSlug: string,
      options?: {
        email?: string;
        name?: string;
      },
    ) => {
      try {
        const session = await createCheckoutSession({
          checkoutSlug,
          email: options?.email,
          name: options?.name,
        });

        // Store session in localStorage
        localStorage.setItem(
          `checkout_session_${checkoutSlug}`,
          JSON.stringify(session),
        );

        return session;
      } catch (error) {
        console.error("Failed to initialize checkout:", error);
        toast.error("Checkout initialization failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      }
    },
    [createCheckoutSession],
  );

  /**
   * Get saved checkout session from localStorage
   */
  const getSavedSession = useCallback((slug: string) => {
    try {
      const savedSession = localStorage.getItem(`checkout_session_${slug}`);
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (error) {
      console.error("Failed to get saved session:", error);
      return null;
    }
  }, []);

  /**
   * Update customer information in a checkout session
   */
  const updateCustomerInfo = useCallback(
    async (
      sessionId: string,
      data: {
        email: string;
        name?: string;
        phone?: string;
        shippingAddress?: {
          fullName: string;
          addressLine1: string;
          addressLine2?: string;
          city: string;
          stateOrProvince: string;
          postalCode: string;
          country: string;
          phoneNumber?: string;
        };
      },
    ) => {
      try {
        await updateCheckoutInfo({
          sessionId,
          ...data,
        });
        return true;
      } catch (error) {
        console.error("Failed to update customer info:", error);
        toast.error("Failed to save information", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    },
    [updateCheckoutInfo],
  );

  /**
   * Complete a checkout and redirect to success page
   */
  const completeCheckoutSession = useCallback(
    async (
      sessionId: string,
      data: {
        paymentMethod: string;
        paymentIntentId?: string;
        billingAddress?: {
          fullName: string;
          addressLine1: string;
          addressLine2?: string;
          city: string;
          stateOrProvince: string;
          postalCode: string;
          country: string;
          phoneNumber?: string;
        };
      },
      successUrl?: string,
    ) => {
      try {
        const result = await completeCheckout({
          sessionId,
          ...data,
        });

        // Clear the session from localStorage
        const sessionKey = Object.keys(localStorage).find(
          (key) =>
            key.startsWith("checkout_session_") &&
            JSON.parse(localStorage.getItem(key) || "{}").sessionId ===
              sessionId,
        );

        if (sessionKey) {
          localStorage.removeItem(sessionKey);
        }

        // Redirect to success page if provided
        if (successUrl) {
          router.push(successUrl);
        } else {
          router.push(`/order-confirmation/${result.orderId}`);
        }

        return true;
      } catch (error) {
        console.error("Failed to complete checkout:", error);
        toast.error("Checkout failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    },
    [completeCheckout, router],
  );

  return {
    getCheckoutBySlug,
    initializeCheckout,
    getSavedSession,
    updateCustomerInfo,
    completeCheckoutSession,
  };
}
