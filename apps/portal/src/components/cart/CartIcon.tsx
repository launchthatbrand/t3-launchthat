"use client";

import React, { useEffect, useState } from "react";

import { ShoppingCart } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@acme/ui";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { v4 as uuidv4 } from "uuid";

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className }: CartIconProps) {
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
  const itemCount = cart?.summary?.itemCount ?? 0;

  return (
    <div className="relative">
      <ShoppingCart className={cn("h-6 w-6", className)} />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </div>
  );
}
