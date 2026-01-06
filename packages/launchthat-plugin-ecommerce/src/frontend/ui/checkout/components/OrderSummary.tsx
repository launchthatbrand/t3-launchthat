"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";

import type { CartItem } from "../types";
import { formatMoney } from "../utils/money";
import { asNumber } from "../utils/number";

export const OrderSummary = ({
  items,
  subtotal,
  onApplyDiscount,
  appliedCouponCode,
  discountAmount,
}: {
  items: Array<CartItem>;
  subtotal: number;
  onApplyDiscount?: (code: string) => void;
  appliedCouponCode?: string;
  discountAmount?: number;
}) => {
  const [discountCode, setDiscountCode] = useState("");
  const normalizedDiscount =
    typeof discountAmount === "number" ? discountAmount : 0;
  const total = Math.max(0, subtotal - normalizedDiscount);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            Your cart is empty.
          </div>
        ) : (
          items.map((item) => {
            const unit =
              typeof item.unitPrice === "number" ? item.unitPrice : 0;
            const qty = asNumber(item.quantity);
            const line = unit * qty;
            const imageUrl =
              typeof item.product?.featuredImageUrl === "string"
                ? item.product.featuredImageUrl
                : "";
            return (
              <div
                key={item._id}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={item.product?.title ?? "Product"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {item.product?.title ?? "Product"}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                      <span>Qty {qty}</span>
                      <span>·</span>
                      <span>{formatMoney(unit)} each</span>
                    </div>
                    {Array.isArray(item.product?.features) &&
                    item.product!.features!.length > 0 ? (
                      <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-xs">
                        {item.product!.features!.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatMoney(line)}</div>
              </div>
            );
          })
        )}
      </div>

      <Separator />

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="discount-code" className="text-xs">
            Discount code
          </Label>
          <Input
            id="discount-code"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.currentTarget.value)}
            placeholder="Discount code"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onApplyDiscount?.(discountCode.trim())}
          disabled={discountCode.trim().length === 0}
        >
          Apply
        </Button>
      </div>

      {appliedCouponCode ? (
        <div className="text-muted-foreground text-xs">
          Applied:{" "}
          <span className="text-foreground font-medium">
            {appliedCouponCode}
          </span>
        </div>
      ) : null}

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatMoney(subtotal)}</span>
        </div>
        {normalizedDiscount > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-semibold">
              -{formatMoney(normalizedDiscount)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Calculated at next step</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Estimated taxes</span>
          <span className="text-muted-foreground">—</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Total</div>
        <div className="text-lg font-semibold">{formatMoney(total)}</div>
      </div>
    </div>
  );
};
