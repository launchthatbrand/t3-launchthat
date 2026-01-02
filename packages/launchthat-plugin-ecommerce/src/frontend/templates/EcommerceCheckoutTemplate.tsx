import type { ReactNode } from "react";
import React from "react";

import { CheckoutClient } from "../ui/CheckoutClient";

export function EcommerceCheckoutTemplate({ ctx }: { ctx: any }): ReactNode {
  const organizationId =
    ctx && typeof ctx === "object" && "organizationId" in ctx
      ? (ctx as { organizationId?: unknown }).organizationId
      : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground text-sm">
          Complete your purchase securely.
        </p>
      </div>

      <CheckoutClient
        organizationId={
          typeof organizationId === "string" ? organizationId : undefined
        }
        // When rendered via the page-template system, we still want default funnel behavior
        // so successful checkout can advance to the next step (e.g., /checkout/order-confirmed).
        funnelSlug="__default_funnel__"
        stepSlug="checkout"
      />
    </div>
  );
}
