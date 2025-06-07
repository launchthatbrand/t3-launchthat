"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useCheckoutStore } from "@/src/store/checkoutStore";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator"; // Assuming you have a Separator

const formatPrice = (price: number | undefined) => {
  if (price === undefined) return "N/A";
  return `$${(price / 100).toFixed(2)}`;
};

export const ReviewStep = () => {
  const { checkoutId, shippingAddress, billingAddress, setCurrentStep } =
    useCheckoutStore();
  const { user } = useConvexAuth(); // Or useUser() from Clerk if preferred for UI user details

  const checkoutSession = useQuery(
    api.ecommerce.checkout.getCheckout,
    checkoutId ? { checkoutId: checkoutId as Id<"checkoutSessions"> } : "skip",
  );

  const cartData = useQuery(
    api.cart.getCart,
    user?.email ? { userId: user.email } : "skip", // Assuming userId for cart is email
  );

  const createOrderMutation = useMutation(
    api.ecommerce.checkout.createOrder as any,
  );
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For displaying items, we'll use cartData if available,
  // otherwise, we might need to enhance checkoutSession to include item snapshots directly
  // For now, this assumes cartData.items would be relevant for the current checkout.

  const handlePlaceOrder = async () => {
    if (!checkoutId) {
      setError("Checkout session is invalid.");
      return;
    }
    setIsPlacingOrder(true);
    setError(null);
    try {
      const orderId = await createOrderMutation({
        checkoutId: checkoutId as Id<"checkoutSessions">,
      });
      console.log("Order placed successfully, Order ID:", orderId);
      // Update zustand store with orderId if needed
      // useCheckoutStore.setState({ orderId: orderId });
      setCurrentStep("confirmation");
    } catch (e: any) {
      console.error("Failed to place order:", e);
      setError(e.message || "Could not place your order. Please try again.");
    }
    setIsPlacingOrder(false);
  };

  if (!checkoutSession || !cartData) {
    return <div>Loading review details...</div>; // Or a more sophisticated loader
  }

  const { items = [], summary: cartSummary } = cartData;
  const { subtotal, taxAmount, shippingAmount, totalAmount } = checkoutSession;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Review Your Order</h2>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item: Doc<"cartItems">) => (
            <div key={item._id} className="flex items-center justify-between">
              <div className="flex items-center">
                {item.productSnapshot.image && (
                  <Image
                    src={item.productSnapshot.image}
                    alt={item.productSnapshot.name}
                    width={64}
                    height={64}
                    className="mr-4 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{item.productSnapshot.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} @ {formatPrice(item.price)}
                  </p>
                </div>
              </div>
              <p className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between">
              <p>Subtotal:</p>
              <p>{formatPrice(subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tax:</p>
              <p>{formatPrice(taxAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping:</p>
              <p>{formatPrice(shippingAmount)}</p>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <p>Total:</p>
              <p>{formatPrice(totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{shippingAddress?.fullName}</p>
            <p>{shippingAddress?.addressLine1}</p>
            {shippingAddress?.addressLine2 && (
              <p>{shippingAddress.addressLine2}</p>
            )}
            <p>
              {shippingAddress?.city}, {shippingAddress?.stateOrProvince}{" "}
              {shippingAddress?.postalCode}
            </p>
            <p>{shippingAddress?.country}</p>
            {shippingAddress?.phoneNumber && (
              <p>Phone: {shippingAddress.phoneNumber}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{billingAddress?.fullName}</p>
            <p>{billingAddress?.addressLine1}</p>
            {billingAddress?.addressLine2 && (
              <p>{billingAddress.addressLine2}</p>
            )}
            <p>
              {billingAddress?.city}, {billingAddress?.stateOrProvince}{" "}
              {billingAddress?.postalCode}
            </p>
            <p>{billingAddress?.country}</p>
            {billingAddress?.phoneNumber && (
              <p>Phone: {billingAddress.phoneNumber}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Card ending in XXXX (Simulated)</p>
          {/* TODO: Display actual last 4 digits or payment method type */}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      <Button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className="w-full"
        size="lg"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  );
};
