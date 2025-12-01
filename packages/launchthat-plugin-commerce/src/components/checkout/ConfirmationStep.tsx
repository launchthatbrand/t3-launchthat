"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import type { Doc, Id } from "../../lib/types";
import {
  useCommerceApi,
  useCommerceQuery,
} from "../../context/CommerceClientProvider";
import { formatPrice } from "../../lib/currency";
import { useCheckoutStore } from "../../store/checkoutStore";

type CartSnapshotItem = Doc<"cartItems"> & {
  productSnapshot?: {
    name?: string;
    image?: string;
    sku?: string;
  };
  quantity?: number;
  price?: number;
};

interface CheckoutSessionSnapshot {
  orderId?: string;
  status?: string;
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  totalAmount?: number;
  cartSnapshot?: {
    items?: CartSnapshotItem[];
    summary?: {
      subtotal?: number;
      taxAmount?: number;
      shippingAmount?: number;
      totalAmount?: number;
    };
  };
}

interface OrderResult {
  cartSnapshot?: {
    items?: CartSnapshotItem[];
    summary?: {
      subtotal?: number;
      taxAmount?: number;
      shippingAmount?: number;
      totalAmount?: number;
    };
  };
  shippingAddress?: {
    fullName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    country?: string;
  };
}

export const ConfirmationStep = () => {
  const commerceApi = useCommerceApi<any>();
  const {
    checkoutId,
    setCurrentStep,
    setCheckoutId,
    setShippingAddress,
    setBillingAddress,
    setIsBillingSameAsShipping,
  } = useCheckoutStore();

  const checkoutSession =
    useCommerceQuery<CheckoutSessionSnapshot>(
      commerceApi?.ecommerce?.checkout?.getCheckout ??
        commerceApi?.checkout?.getCheckout,
      checkoutId
        ? { checkoutId: checkoutId as Id<"checkoutSessions"> }
        : "skip",
    ) ?? undefined;

  const orderId = checkoutSession?.orderId;
  const order =
    useCommerceQuery<OrderResult>(
      commerceApi?.ecommerce?.orders?.getOrder,
      orderId ? { orderId } : "skip",
    ) ?? undefined;

  // Reset checkout store on component mount/unmount or after a delay?
  // For now, let's suggest a manual reset via a button or upon navigating away.
  useEffect(() => {
    // Optional: Clear sensitive parts of checkout store if desired upon reaching confirmation
    // For example, clear payment details if they were stored (they are not currently)
    // Or, if this component unmounts, reset the whole checkout flow:
    return () => {
      // This is a simple reset, consider more granular control or persistence if needed
      // setCurrentStep("shipping");
      // setCheckoutId(null);
      // setShippingAddress(null);
      // setBillingAddress(null);
      // setIsBillingSameAsShipping(true);
    };
  }, []);

  if (!checkoutSession) {
    return <div>Loading confirmation details...</div>;
  }

  if (checkoutSession.status !== "completed" || !orderId) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-xl font-semibold text-orange-600">
          Awaiting Order Confirmation
        </h2>
        <p>Your order is still processing or the session is invalid.</p>
        <p>
          If you have already placed your order, please check your email for a
          confirmation.
        </p>
        <Link href="/store" passHref>
          <Button variant="outline" className="mt-6">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  // Use cartSnapshot from the order if available, otherwise from checkoutSession
  const cartSnapshot = order?.cartSnapshot ?? checkoutSession?.cartSnapshot;
  const itemsToDisplay: CartSnapshotItem[] = cartSnapshot?.items ?? [];
  const summaryToDisplay = cartSnapshot?.summary ?? {
    subtotal: checkoutSession.subtotal,
    taxAmount: checkoutSession.taxAmount,
    shippingAmount: checkoutSession.shippingAmount,
    totalAmount: checkoutSession.totalAmount,
  };

  return (
    <div className="space-y-8 py-8 text-center">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="items-center">
          <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          <CardTitle className="text-3xl">Thank You For Your Order!</CardTitle>
          <CardDescription className="text-md">
            Your order{" "}
            <span className="font-semibold">
              #{orderId.substring(orderId.length - 8)}
            </span>{" "}
            has been placed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          <p className="text-muted-foreground">
            You will receive an email confirmation shortly with your order
            details and tracking information (once shipped).
          </p>

          <Separator />
          <h3 className="text-lg font-semibold">Order Summary</h3>
          {itemsToDisplay.map(
            (
              item: Doc<"cartItems"> | any, // Use any for snapshot flexibility
            ) => (
              <div
                key={item.productSnapshot?.sku || item._id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  {item.productSnapshot?.image && (
                    <Image
                      src={item.productSnapshot.image}
                      alt={item.productSnapshot.name}
                      width={48}
                      height={48}
                      className="mr-3 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.productSnapshot?.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Qty: {item.quantity} @ {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <p>{formatPrice(item.price * item.quantity)}</p>
              </div>
            ),
          )}
          <Separator />
          <div className="space-y-1">
            <div className="flex justify-between">
              <p>Subtotal:</p>
              <p>{formatPrice(summaryToDisplay.subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Tax:</p>
              <p>{formatPrice(summaryToDisplay.taxAmount)}</p>
            </div>
            <div className="flex justify-between">
              <p>Shipping:</p>
              <p>{formatPrice(summaryToDisplay.shippingAmount)}</p>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <p>Total:</p>
              <p>{formatPrice(summaryToDisplay.totalAmount)}</p>
            </div>
          </div>

          {order?.shippingAddress && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-lg font-semibold">Shipping To</h3>
                <address className="text-muted-foreground text-sm not-italic">
                  {order.shippingAddress.fullName}
                  <br />
                  {order.shippingAddress.addressLine1}
                  <br />
                  {order.shippingAddress.addressLine2 ? (
                    <>
                      {order.shippingAddress.addressLine2}
                      <br />
                    </>
                  ) : (
                    ""
                  )}
                  {order.shippingAddress.city},{" "}
                  {order.shippingAddress.stateOrProvince}{" "}
                  {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                </address>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/store" passHref>
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          {/* TODO: Link to order history page if/when implemented */}
          {/* <Link href={`/account/orders/${orderId}`} passHref> 
            <Button>View Order Details</Button>
          </Link> */}
        </CardFooter>
      </Card>
    </div>
  );
};
