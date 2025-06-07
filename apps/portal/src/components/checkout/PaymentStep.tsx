"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useCheckoutStore } from "@/src/store/checkoutStore";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation } from "convex/react";

import { Button } from "@acme/ui/button";

import { env } from "~/env";

// Initialize Stripe.js with your publishable key
// USER ACTION REQUIRED: Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is correctly set up
// in your environment and exposed to the client (e.g., in .env.local).
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { setCurrentStep, checkoutId, setPaymentIntentId } = useCheckoutStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPaymentAction = useMutation(
    api.ecommerce.checkout.processPayment as any,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      setIsLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError(
        "Card element not found. Please ensure Stripe Elements are loaded correctly.",
      );
      setIsLoading(false);
      return;
    }

    if (!checkoutId) {
      setError("Checkout session not found. Cannot process payment.");
      setIsLoading(false);
      return;
    }

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (pmError) {
      setError(pmError.message ?? "Failed to create payment method.");
      setIsLoading(false);
      return;
    }

    try {
      // Cast response to a more specific type if possible, or use 'any' cautiously.
      const response: any = await processPaymentAction({
        checkoutId: checkoutId as Id<"checkoutSessions">,
        paymentMethodId: paymentMethod.id,
      });

      if (response && response.success) {
        if (
          response.paymentIntentId &&
          typeof response.paymentIntentId === "string"
        ) {
          console.log(
            "Payment processing initiated, Payment Intent ID:",
            response.paymentIntentId,
          );
          setPaymentIntentId(response.paymentIntentId);
          setCurrentStep("review");
        } else {
          setError("Payment succeeded but Payment Intent ID was not returned.");
        }
      } else {
        const errorMessage =
          response?.error ??
          "Payment failed during backend processing. Please try again.";
        setError(errorMessage);
      }
    } catch (e: any) {
      console.error("Payment processing error:", e);
      setError(e.message || "An unexpected error occurred during payment.");
    }

    setIsLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="card-element"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Card Details
        </label>
        <div
          id="card-element"
          className="rounded-md border border-gray-300 p-3 shadow-sm"
        >
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? "Processing..." : "Continue to Review"}
      </Button>
    </form>
  );
};

export const PaymentStep = () => {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Payment Details</h2>
      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
      <p className="mt-4 text-xs text-gray-500">
        Secure payment processing by Stripe. Your card details are not stored on
        our servers.
      </p>
    </div>
  );
};
