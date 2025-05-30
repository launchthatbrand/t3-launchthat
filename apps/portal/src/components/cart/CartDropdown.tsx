"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
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

import { CartIcon } from "./CartIcon";

// Define types for cart items that match the schema
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
  const { user } = useClerk();
  const userId = user?.id ?? "";
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
  const cart = useQuery(api.cart.getCart, {
    userId: userId || undefined,
    guestSessionId: !userId ? guestSessionId : undefined,
  });

  // Use nullish coalescing for safer handling of undefined values
  const cartItems = cart?.items ?? [];
  const cartSummary = cart?.summary ?? { itemCount: 0, subtotal: 0 };

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
          <span className="text-sm text-muted-foreground">
            {cartSummary.itemCount}{" "}
            {cartSummary.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <Separator />

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6">
            <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/store">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
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
      <div className="relative h-16 w-16 overflow-hidden rounded border bg-muted">
        {item.productSnapshot.image ? (
          <Image
            src={item.productSnapshot.image}
            alt={item.productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ShoppingCart className="h-4 w-4 text-secondary-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-medium leading-tight">
          {item.productSnapshot.name}
        </h4>
        {item.variationSnapshot && (
          <p className="text-xs text-muted-foreground">
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
          <span className="mx-1 text-muted-foreground">×</span>
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
  const removeCartMutation = useMutation(api.cart.removeFromCart);
  const removeGuestCartMutation = useMutation(api.cart.removeFromGuestCart);

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
