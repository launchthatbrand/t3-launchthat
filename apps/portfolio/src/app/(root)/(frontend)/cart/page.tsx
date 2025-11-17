"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@convex-config/ecommerce/lib";
import {
  ArrowRight,
  MoveRight,
  RefreshCw,
  Save,
  ShoppingBag,
  ShoppingCart,
  Trash,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

import { useCart } from "~/hooks/useCart";

export default function CartPage() {
  const cartCtx = useCart();
  const cartItems: Doc<"cartItems">[] = (cartCtx.cartItems ??
    []) as Doc<"cartItems">[];
  const savedItems: Doc<"cartItems">[] = (cartCtx.savedItems ??
    []) as Doc<"cartItems">[];
  const cartSummary =
    cartCtx.cartSummary ??
    ({
      itemCount: 0,
      subtotal: 0,
      estimatedTax: 0,
      estimatedShipping: 0,
      updatedAt: Date.now(),
    } as const);

  console.log("CART ITEMS", cartItems);
  const { removeFromCart, updateCartItem, clearCart } = cartCtx;

  const isCartLoading = cartCtx.cartItems === undefined;

  // Handle quantity updates
  const handleQuantityChange = async (
    itemId: Id<"cartItems">,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, { quantity });
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: Id<"cartItems">) => {
    await removeFromCart(itemId);
  };

  // Handle save for later / move to cart (stubs)
  const handleSaveForLater = async (_itemId: Id<"cartItems">) => {};
  const handleMoveToCart = async (_itemId: Id<"cartItems">) => {};

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      await clearCart();
    }
  };

  // If cart is empty
  // if (cartItems.length === 0) {
  //   return (
  //     <div className="container py-12">
  //       <div className="flex flex-col items-center justify-center space-y-4 py-12">
  //         <ShoppingCart className="h-16 w-16 text-muted-foreground" />
  //         <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
  //         <p className="text-center text-muted-foreground">
  //           Looks like you haven&apos;t added anything to your cart yet.
  //         </p>
  //         <Button asChild>
  //           <Link href="/store">
  //             <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
  //           </Link>
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Cart Items */}

        <div className="space-y-8 md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-0 text-xl font-semibold">
              Cart Items (
              {isCartLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                cartSummary.itemCount
              )}
              )
            </h2>
            <Button variant="ghost" size="sm" onClick={handleClearCart}>
              <RefreshCw className="mr-2 h-4 w-4" /> Clear Cart
            </Button>
          </div>

          {isCartLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : cartItems.length > 0 ? (
            <div>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item._id}
                    item={item}
                    onQuantityChange={(quantity) =>
                      handleQuantityChange(item._id, quantity)
                    }
                    onRemove={() => handleRemoveItem(item._id)}
                    onSaveForLater={() => handleSaveForLater(item._id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border bg-muted/20 py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Your cart is empty
              </p>
              <Button asChild variant="outline">
                <Link href="/store">Continue Shopping</Link>
              </Button>
            </div>
          )}

          {/* Saved Items */}
          {savedItems.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                Saved for Later ({savedItems.length})
              </h2>
              <div className="space-y-4">
                {savedItems.map((item) => (
                  <SavedItemCard
                    key={item._id}
                    item={item}
                    onRemove={() => handleRemoveItem(item._id)}
                    onMoveToCart={() => handleMoveToCart(item._id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary */}

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {isCartLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    formatPrice(cartSummary.subtotal)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {isCartLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : cartSummary.estimatedShipping === 0 ? (
                    "Free"
                  ) : (
                    formatPrice(cartSummary.estimatedShipping ?? 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (estimated)</span>
                <span>
                  {isCartLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    formatPrice(cartSummary.estimatedTax ?? 0)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>
                  {isCartLoading ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    formatPrice(
                      cartSummary.subtotal +
                        (cartSummary.estimatedShipping ?? 0) +
                        (cartSummary.estimatedTax ?? 0),
                    )
                  )}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: Doc<"cartItems">;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
}

function CartItemCard({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: CartItemCardProps) {
  return (
    <div className="flex space-x-4 rounded-lg border p-4">
      <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
        {item.productSnapshot.image ? (
          <Image
            src={item.productSnapshot.image}
            alt={item.productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ShoppingBag className="h-8 w-8 text-secondary-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{item.productSnapshot.name}</h3>
            {item.variationSnapshot && (
              <p className="text-sm text-muted-foreground">
                {item.variationSnapshot.name}
              </p>
            )}
            <p className="mt-1 text-sm font-medium">
              {formatPrice(item.price)}
            </p>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onSaveForLater}>
              <Save className="h-4 w-4" />
              <span className="sr-only">Save for later</span>
            </Button>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => onQuantityChange(item.quantity - 1)}
            >
              -
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => onQuantityChange(item.quantity + 1)}
            >
              +
            </Button>
          </div>
          <p className="font-medium">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface SavedItemCardProps {
  item: Doc<"cartItems">;
  onRemove: () => void;
  onMoveToCart: () => void;
}

function SavedItemCard({ item, onRemove, onMoveToCart }: SavedItemCardProps) {
  return (
    <div className="flex space-x-4 rounded-lg border bg-muted/20 p-4">
      <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
        {item.productSnapshot.image ? (
          <Image
            src={item.productSnapshot.image}
            alt={item.productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ShoppingBag className="h-8 w-8 text-secondary-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{item.productSnapshot.name}</h3>
            {item.variationSnapshot && (
              <p className="text-sm text-muted-foreground">
                {item.variationSnapshot.name}
              </p>
            )}
            <p className="mt-1 text-sm font-medium">
              {formatPrice(item.price)}
            </p>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onMoveToCart}
          >
            <MoveRight className="mr-2 h-4 w-4" />
            Move to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
