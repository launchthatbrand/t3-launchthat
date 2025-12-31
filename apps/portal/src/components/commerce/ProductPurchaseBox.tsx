"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

type PostMetaValue = string | number | boolean | null | undefined;

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (amount: number): string => `$${amount.toFixed(2)}`;

export function ProductPurchaseBox({
  postId,
  organizationId: _organizationId,
  postMeta,
}: {
  postId: string;
  organizationId?: string;
  postMeta: Record<string, PostMetaValue>;
}) {
  const [qty, setQty] = useState("1");
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
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

  const addToGuestCart = useMutation(api.plugins.commerce.cart.mutations.addToGuestCart) as (
    args: any,
  ) => Promise<any>;

  const regularPrice = useMemo(() => asNumber(postMeta["product.regularPrice"]), [postMeta]);
  const salePrice = useMemo(() => asNumber(postMeta["product.salePrice"]), [postMeta]);
  const price = salePrice > 0 ? salePrice : regularPrice;

  const handleAddToCart = () => {
    if (!guestSessionId) return;
    const quantity = Math.max(1, Math.floor(asNumber(qty)));
    startTransition(() => {
      void addToGuestCart({
        guestSessionId,
        productPostId: postId,
        quantity,
      })
        .then(() => toast.success("Added to cart"))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to add to cart"),
        );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase</CardTitle>
        <CardDescription>Quick add to cart.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-semibold">
          {price > 0 ? formatMoney(price) : "Free"}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            step="1"
            className="w-24"
            value={qty}
            onChange={(e) => setQty(e.currentTarget.value)}
          />
          <Button type="button" onClick={handleAddToCart} disabled={!guestSessionId || isPending}>
            Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


