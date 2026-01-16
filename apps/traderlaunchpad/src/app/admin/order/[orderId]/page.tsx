"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { TraderLaunchpadOrderDetailPage } from "launchthat-plugin-traderlaunchpad/frontend/journal";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";
  const kindParam = searchParams.get("kind");
  const kind =
    kindParam === "history" || kindParam === "order" ? kindParam : undefined;

  if (!orderId) {
    return <div className="text-muted-foreground text-sm">Missing order id.</div>;
  }

  return (
    <TraderLaunchpadOrderDetailPage
      api={{
        queries: api.traderlaunchpad.queries,
        actions: api.traderlaunchpad.actions,
      }}
      orderId={orderId}
      kind={kind}
      backHref="/admin/orders"
    />
  );
}
