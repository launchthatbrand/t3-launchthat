"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingCart, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Separator } from "@acme/ui/separator";

import type { Id } from "../../lib/types";
import {
  useCommerceApi,
  useCommerceAuth,
  useCommerceMutation,
  useCommerceQuery,
} from "../../context/CommerceClientProvider";
import { formatPrice } from "../../lib/currency";
import { CartIcon } from "./CartIcon";

interface ProductSnapshot {
  name: string;
  description?: string;
  sku?: string;
  image?: string;
  slug?: string;
}

interface VariationAttribute {
  name: string;
  value: string;
}

// Define the interface to match the database schema
interface CartItemType {
  _id: Id<"cartItems">;
  _creationTime: number;
  userId?: string;
  guestSessionId?: string;
  productId: Id<"products">;
  variationId?: Id<"productVariants">;
  quantity: number;
  price: number;
  savedForLater: boolean;
  productSnapshot: ProductSnapshot;
  variationSnapshot?: {
    name: string;
    attributes: VariationAttribute[];
  };
  addedAt: number;
  updatedAt: number;
}

export function CartDropdown() {
  const commerceApi = useCommerceApi<any>();
  const { userId: authUserId } = useCommerceAuth();
  const userId = authUserId ?? "";
  const [guestSessionId, setGuestSessionId] = useState<string>("");

  // Set up a guest session ID if no user is logged in
  useEffect(() => {
    if (!userId) {
      // Try to get an existing guest session ID from localStorage
      let sessionId = localStorage.getItem("guestCartSessionId");
      if (!sessionId) {
        // Create a new guest session ID if none exists
        sessionId = uuidv4();
        localStorage.setItem("guestCartSessionId", sessionId);
      }
      setGuestSessionId(sessionId);
    }
  }, [userId]);

  // Always call useQuery, using either userId or guestSessionId
  const cartData =
    useCommerceQuery<{
      items?: CartItemType[];
      summary?: { itemCount: number; subtotal: number };
    }>(
      commerceApi?.cart?.getCart,
      commerceApi
        ? {
            userId: userId || undefined,
            guestSessionId: !userId ? guestSessionId : undefined,
          }
        : "skip",
    ) ?? undefined;

  const cartItems: CartItemType[] = cartData?.items ?? [];
  const cartSummary = cartData?.summary ?? { itemCount: 0, subtotal: 0 };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CartIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">My Cart</h3>
          <span className="text-muted-foreground text-sm">
            {cartSummary.itemCount}{" "}
            {cartSummary.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <Separator />

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6">
            <ShoppingCart className="text-muted-foreground mb-2 h-10 w-10" />
            <p className="text-muted-foreground text-sm">Your cart is empty</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/store">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {cartItems.map((item: CartItemType) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    userId={userId}
                    guestSessionId={!userId ? guestSessionId : undefined}
                  />
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-sm font-medium">
                  {formatPrice(cartSummary.subtotal)}
                </span>
              </div>
              <Button asChild className="w-full">
                <Link href="/checkout">
                  Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/cart">View Cart</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface CartItemProps {
  item: CartItemType;
  userId: string;
  guestSessionId?: string;
}

// Helper function to display variation attributes
function formatVariationAttributes(attributes: VariationAttribute[]): string {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return "";
  }

  return attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ");
}

function CartItem({ item, userId, guestSessionId }: CartItemProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="bg-muted relative h-16 w-16 overflow-hidden rounded border">
        {item.productSnapshot.image ? (
          <Image
            src={item.productSnapshot.image}
            alt={item.productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="bg-secondary flex h-full w-full items-center justify-center">
            <ShoppingCart className="text-secondary-foreground h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm leading-tight font-medium">
          {item.productSnapshot.name}
        </h4>
        {item.variationSnapshot && (
          <p className="text-muted-foreground text-xs">
            {item.variationSnapshot.name}
            {item.variationSnapshot.attributes.length > 0 && (
              <span className="block">
                {formatVariationAttributes(item.variationSnapshot.attributes)}
              </span>
            )}
          </p>
        )}
        <div className="flex items-center text-sm">
          <span>{formatPrice(item.price)}</span>
          <span className="text-muted-foreground mx-1">×</span>
          <span>{item.quantity}</span>
        </div>
      </div>
      <CartItemRemoveButton
        itemId={item._id}
        userId={userId}
        guestSessionId={guestSessionId}
      />
    </div>
  );
}

interface CartItemRemoveButtonProps {
  itemId: Id<"cartItems">;
  userId: string;
  guestSessionId?: string;
}

function CartItemRemoveButton({
  itemId,
  userId,
  guestSessionId,
}: CartItemRemoveButtonProps) {
  const commerceApi = useCommerceApi<any>();
  const removeCartMutation = useCommerceMutation(
    commerceApi?.cart?.removeFromCart,
  );
  const removeGuestCartMutation = useCommerceMutation(
    commerceApi?.cart?.removeFromGuestCart,
  );

  const handleRemove = async () => {
    try {
      if (userId) {
        await removeCartMutation({
          userId,
          cartItemId: itemId,
        });
      } else if (guestSessionId) {
        await removeGuestCartMutation({
          guestSessionId,
          cartItemId: itemId,
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleRemove}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Remove</span>
    </Button>
  );
}
