"use client";

import React, { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { cn } from "@acme/ui";

import {
  useCommerceApi,
  useCommerceAuth,
  useCommerceQuery,
} from "../../context/CommerceClientProvider";

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className }: CartIconProps) {
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
      summary?: { itemCount: number };
    }>(
      commerceApi?.cart?.getCart,
      commerceApi
        ? {
            userId: userId || undefined,
            guestSessionId: !userId ? guestSessionId : undefined,
          }
        : "skip",
    ) ?? undefined;

  const itemCount = cartData?.summary?.itemCount ?? 0;

  return (
    <div className="relative">
      <ShoppingCart className={cn("h-6 w-6", className)} />
      {itemCount > 0 && (
        <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </div>
  );
}
