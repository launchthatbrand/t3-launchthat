import type { ReactNode } from "react";
import React from "react";

import { ShopClient } from "../ui/ShopClient";

export function EcommerceShopTemplate({ ctx }: { ctx: any }): ReactNode {
  const organizationId =
    ctx && typeof ctx === "object" && "organizationId" in ctx
      ? (ctx as { organizationId?: unknown }).organizationId
      : undefined;

  return (
    <div className="container flex-1 space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="text-muted-foreground text-sm">
          Browse products available in this portal.
        </p>
      </div>

      <ShopClient
        organizationId={
          typeof organizationId === "string" ? organizationId : undefined
        }
      />
    </div>
  );
}
