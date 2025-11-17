"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import type { Doc } from "@convex-config/_generated/dataModel";
import Image from "next/image";
import { Separator } from "@acme/ui/separator";
import { useCart } from "~/hooks/useCart";

const formatPrice = (price: number | undefined) => {
  if (price === undefined) return "N/A";
  return `$${(price / 100).toFixed(2)}`;
};

export const ReviewStep = () => {
  const { cart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock checkout session data for now
  const checkoutSession = {
    subtotal: 2000, // $20.00 in cents
    taxAmount: 200, // $2.00 in cents
    shippingAmount: 500, // $5.00 in cents
    totalAmount: 2700, // $27.00 in cents
  };

  // Mock addresses for now
  const shippingAddress = {
    fullName: "Guest User",
    addressLine1: "123 Main St",
    addressLine2: "",
    city: "Anytown",
    stateOrProvince: "ST",
    postalCode: "12345",
    country: "US",
    phoneNumber: "",
  };

  const billingAddress = shippingAddress;

  // For displaying items, we'll use cartData if available,
  // otherwise, we might need to enhance checkoutSession to include item snapshots directly
  // For now, this assumes cartData.items would be relevant for the current checkout.

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setError(null);
    try {
      // TODO: Implement actual order creation
      console.log("Placing order with cart:", cart);
      // Simulate order processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Order placed successfully");
      // TODO: Navigate to confirmation step
    } catch (e) {
      console.error("Failed to place order:", e);
      setError(
        e instanceof Error
          ? e.message
          : "Could not place your order. Please try again.",
      );
    }
    setIsPlacingOrder(false);
  };

  if (!cart) {
    return <div>Loading review details...</div>;
  }

  const { items = [] } = cart;
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
            <p>{shippingAddress.fullName}</p>
            <p>{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && (
              <p>{shippingAddress.addressLine2}</p>
            )}
            <p>
              {shippingAddress.city}, {shippingAddress.stateOrProvince}{" "}
              {shippingAddress.postalCode}
            </p>
            <p>{shippingAddress.country}</p>
            {shippingAddress.phoneNumber && (
              <p>Phone: {shippingAddress.phoneNumber}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{billingAddress.fullName}</p>
            <p>{billingAddress.addressLine1}</p>
            {billingAddress.addressLine2 && (
              <p>{billingAddress.addressLine2}</p>
            )}
            <p>
              {billingAddress.city}, {billingAddress.stateOrProvince}{" "}
              {billingAddress.postalCode}
            </p>
            <p>{billingAddress.country}</p>
            {billingAddress.phoneNumber && (
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
