"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

const apiAny = api as any;

type CartItem = {
  _id: string;
  productPostId: string;
  quantity: number;
  unitPrice?: number | null;
  product?: { _id: string; title?: string; slug?: string } | null;
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

export function CartClient({ organizationId: _organizationId }: { organizationId?: string }) {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("guestCartSessionId");
    if (existing) {
      setGuestSessionId(existing);
      return;
    }
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now());
    window.localStorage.setItem("guestCartSessionId", created);
    setGuestSessionId(created);
  }, []);

  const cart = useQuery(
    apiAny.plugins.commerce.cart.queries.getCart,
    guestSessionId ? { guestSessionId } : "skip",
  ) as { items?: CartItem[] } | undefined;

  const clearCart = useMutation(apiAny.plugins.commerce.cart.mutations.clearCart) as (
    args: any,
  ) => Promise<any>;

  const items = useMemo(() => (Array.isArray(cart?.items) ? cart?.items ?? [] : []), [cart]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const unit = typeof item.unitPrice === "number" ? item.unitPrice : 0;
      return sum + unit * (item.quantity ?? 0);
    }, 0);
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your cart</CardTitle>
        <CardDescription>Items added to your cart.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-muted-foreground text-sm">Your cart is empty.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const unit = typeof item.unitPrice === "number" ? item.unitPrice : 0;
              const qty = asNumber(item.quantity);
              const line = unit * qty;
              return (
                <div key={item._id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {item.product?.title ?? "Product"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Qty: {qty} • Unit: {formatMoney(unit)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{formatMoney(line)}</div>
                </div>
              );
            })}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => (guestSessionId ? clearCart({ guestSessionId }) : null)}
              disabled={!guestSessionId}
            >
              Clear cart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


