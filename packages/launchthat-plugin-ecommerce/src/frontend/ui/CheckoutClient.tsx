"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

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

export function CheckoutClient({ organizationId }: { organizationId?: string }) {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

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

  const createOrder = useMutation(
    apiAny.plugins.commerce.orders.mutations.createOrder,
  ) as (args: any) => Promise<any>;
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

  const canSubmit = items.length > 0 && email.trim().length > 3 && !isPending;

  const handlePlaceOrder = () => {
    if (!guestSessionId) return;
    startTransition(() => {
      void createOrder({
        organizationId,
        email: email.trim(),
        subtotal,
        total: subtotal,
        payload: JSON.stringify({
          guestSessionId,
          items: items.map((i) => ({
            productPostId: i.productPostId,
            quantity: i.quantity,
            unitPrice: i.unitPrice ?? null,
          })),
        }),
      })
        .then(async (result: any) => {
          await clearCart({ guestSessionId });
          toast.success("Order placed.");
          return result;
        })
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Checkout failed"),
        );
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>We’ll email your receipt and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="checkout-email">Email</Label>
              <Input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@example.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="h-6" />

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Your cart items and pricing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Your cart is empty.
              </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Totals for this order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={!canSubmit}
            >
              Place order
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


