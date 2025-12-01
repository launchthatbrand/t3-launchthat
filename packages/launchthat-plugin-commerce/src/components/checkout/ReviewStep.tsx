"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import type { Doc, Id } from "../../lib/types";
import {
  useCommerceApi,
  useCommerceAuth,
  useCommerceMutation,
  useCommerceQuery,
} from "../../context/CommerceClientProvider";
import { formatPrice } from "../../lib/currency";
import { useCheckoutStore } from "../../store/checkoutStore";

type ReviewCartItem = Doc<"cartItems"> & {
  productSnapshot?: {
    image?: string;
    name?: string;
  };
  quantity?: number;
  price?: number;
};

interface CheckoutSnapshot {
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  totalAmount?: number;
  cartSnapshot?: {
    items?: ReviewCartItem[];
    summary?: {
      subtotal?: number;
      taxAmount?: number;
      shippingAmount?: number;
      totalAmount?: number;
    };
  };
}

export const ReviewStep = () => {
  const commerceApi = useCommerceApi<any>();
  const { userId } = useCommerceAuth();
  const { checkoutId, shippingAddress, billingAddress, setCurrentStep } =
    useCheckoutStore();

  const [guestSessionId, setGuestSessionId] = useState<string>("");

  useEffect(() => {
    if (userId) return;
    let sessionId = localStorage.getItem("guestCartSessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("guestCartSessionId", sessionId);
    }
    setGuestSessionId(sessionId);
  }, [userId]);

  const checkoutSession =
    useCommerceQuery<CheckoutSnapshot>(
      commerceApi?.ecommerce?.checkout?.getCheckout ??
        commerceApi?.checkout?.getCheckout,
      checkoutId
        ? { checkoutId: checkoutId as Id<"checkoutSessions"> }
        : "skip",
    ) ?? undefined;

  const cart =
    useCommerceQuery<{
      items?: ReviewCartItem[];
      summary?: {
        subtotal?: number;
        taxAmount?: number;
        shippingAmount?: number;
        totalAmount?: number;
      };
    }>(
      commerceApi?.cart?.getCart,
      commerceApi
        ? {
            userId: userId ?? undefined,
            guestSessionId: userId ? undefined : guestSessionId || undefined,
          }
        : "skip",
    ) ?? undefined;

  const completeCheckout = useCommerceMutation(
    commerceApi?.ecommerce?.checkout?.completeCheckout ??
      commerceApi?.checkout?.completeCheckout,
  );

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!checkoutSession) {
    return <div>Loading review details...</div>;
  }

  const items: ReviewCartItem[] =
    checkoutSession.cartSnapshot?.items ?? cart?.items ?? [];
  const summary = {
    subtotal:
      checkoutSession.cartSnapshot?.summary?.subtotal ??
      checkoutSession.subtotal ??
      cart?.summary?.subtotal ??
      0,
    taxAmount:
      checkoutSession.cartSnapshot?.summary?.taxAmount ??
      checkoutSession.taxAmount ??
      cart?.summary?.taxAmount ??
      0,
    shippingAmount:
      checkoutSession.cartSnapshot?.summary?.shippingAmount ??
      checkoutSession.shippingAmount ??
      cart?.summary?.shippingAmount ??
      0,
    totalAmount:
      checkoutSession.cartSnapshot?.summary?.totalAmount ??
      checkoutSession.totalAmount ??
      cart?.summary?.totalAmount ??
      0,
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setError(null);
    try {
      if (!checkoutId) {
        setError("Checkout session missing. Please restart checkout.");
        setIsPlacingOrder(false);
        return;
      }
      await completeCheckout({
        checkoutId: checkoutId as Id<"checkoutSessions">,
      });
      setCurrentStep("confirmation");
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Review Your Order</h2>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item: ReviewCartItem) => {
            const unitPrice = item.price ?? 0;
            const quantity = item.quantity ?? 1;
            return (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {item.productSnapshot?.image && (
                    <Image
                      src={item.productSnapshot.image}
                      alt={item.productSnapshot.name ?? "Product image"}
                      width={64}
                      height={64}
                      className="mr-4 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {item.productSnapshot?.name ?? "Product"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Qty: {quantity} @ {formatPrice(unitPrice)}
                    </p>
                  </div>
                </div>
                <p className="font-medium">
                  {formatPrice(unitPrice * quantity)}
                </p>
              </div>
            );
          })}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between">
              <p>Subtotal:</p>
              <p>{formatPrice(summary.subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tax:</p>
              <p>{formatPrice(summary.taxAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping:</p>
              <p>{formatPrice(summary.shippingAmount)}</p>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <p>Total:</p>
              <p>{formatPrice(summary.totalAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{shippingAddress.fullName ?? ""}</p>
              <p>{shippingAddress.addressLine1 ?? ""}</p>
              {shippingAddress.addressLine2 && (
                <p>{shippingAddress.addressLine2}</p>
              )}
              <p>
                {shippingAddress.city ?? ""},{" "}
                {shippingAddress.stateOrProvince ?? shippingAddress.state ?? ""}{" "}
                {shippingAddress.postalCode ?? ""}
              </p>
              <p>{shippingAddress.country ?? ""}</p>
              {(shippingAddress.phoneNumber ?? shippingAddress.phone) && (
                <p>
                  Phone:{" "}
                  {shippingAddress.phoneNumber ?? shippingAddress.phone ?? ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {billingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{billingAddress.fullName ?? ""}</p>
              <p>{billingAddress.addressLine1 ?? ""}</p>
              {billingAddress.addressLine2 && (
                <p>{billingAddress.addressLine2}</p>
              )}
              <p>
                {billingAddress.city ?? ""},{" "}
                {billingAddress.stateOrProvince ?? billingAddress.state ?? ""}{" "}
                {billingAddress.postalCode ?? ""}
              </p>
              <p>{billingAddress.country ?? ""}</p>
              {(billingAddress.phoneNumber ?? billingAddress.phone) && (
                <p>
                  Phone:{" "}
                  {billingAddress.phoneNumber ?? billingAddress.phone ?? ""}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Card ending in XXXX (Simulated)</p>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      <Button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder || !checkoutId}
        className="w-full"
        size="lg"
      >
        {isPlacingOrder ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  );
};
