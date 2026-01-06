"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import type { ReceiptLineItem } from "../types";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { formatMoney } from "../utils/money";

export const ThankYouReceipt = ({
  isLoading,
  orderId,
  email,
  status,
  paymentMethodId,
  gateway,
  transactionId,
  items,
  total,
  showActions,
}: {
  isLoading: boolean;
  orderId: string;
  email: string;
  status: string;
  paymentMethodId: string;
  gateway: string;
  transactionId: string;
  items: Array<ReceiptLineItem>;
  total: number;
  showActions?: boolean;
}) => {
  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
              {isLoading ? (
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Receipt</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading your order…"
                  : "Keep this page for your records."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Order</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <code className="truncate">{orderId}</code>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-44" />
                ) : (
                  <span className="truncate">{email}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="capitalize">{status || "paid"}</span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-28" />
                ) : (
                  <span className="truncate">
                    {paymentMethodId || gateway || "card"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Transaction</span>
                {isLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : (
                  <code className="truncate">{transactionId || "—"}</code>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-sm font-semibold">Items</div>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/6" />
              </div>
            ) : (
              <div className="mx-auto max-w-lg space-y-2">
                {items.length === 0 ? (
                  <div className="text-muted-foreground text-sm">—</div>
                ) : (
                  items.map((i, idx) => (
                    <div
                      key={`${i.title}-${idx}`}
                      className="flex items-start justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{i.title}</div>
                        <div className="text-muted-foreground text-xs">
                          Qty {i.quantity} · {formatMoney(i.unitPrice)} each
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatMoney(i.unitPrice * i.quantity)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Total</div>
            {isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-lg font-semibold">{formatMoney(total)}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {showActions ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => window.location.assign("/")}
            disabled={isLoading}
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.assign("/checkout")}
            disabled={isLoading}
          >
            Back to checkout
          </Button>
        </div>
      ) : null}
    </div>
  );
};
