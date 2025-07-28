"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Button } from "@acme/ui/button";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "~/hooks/useCart";

export default function CheckoutPage() {
  const { cartItems, isAuthenticated, sessionId } = useCart();

  // Check if cart is loading
  if (cartItems === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Button asChild>
              <Link href="/store/product">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Show session info for guest users */}
      {!isAuthenticated && sessionId && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Guest Checkout:</strong> You're checking out as a guest.
              An account will be created for you after completing your purchase.
            </p>
          </CardContent>
        </Card>
      )}

      <CheckoutFlow />
    </div>
  );
}
