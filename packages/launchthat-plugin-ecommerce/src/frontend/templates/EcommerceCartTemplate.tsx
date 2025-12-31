import type { ReactNode } from "react";
import React from "react";

import { CartClient } from "../ui/CartClient";

export function EcommerceCartTemplate({ ctx }: { ctx: any }): ReactNode {
  const organizationId =
    ctx && typeof ctx === "object" && "organizationId" in ctx
      ? (ctx as { organizationId?: unknown }).organizationId
      : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <p className="text-muted-foreground text-sm">
          Review your items before checking out.
        </p>
      </div>

      <CartClient organizationId={typeof organizationId === "string" ? organizationId : undefined} />
    </div>
  );
}


