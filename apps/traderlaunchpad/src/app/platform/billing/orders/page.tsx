 "use client";

import { useRouter } from "next/navigation";
import { EcommerceOrdersPage } from "launchthat-plugin-ecommerce/admin";
import { api } from "@convex-config/_generated/api";

interface OrderRow {
  _id: string;
}

export default function PlatformBillingOrdersPage() {
  const router = useRouter();
  const commerceApi = (
    api as unknown as {
      platform: {
        ecommerce: {
          listOrders: unknown;
          createOrder: unknown;
        };
      };
    }
  ).platform.ecommerce;

  return (
    <EcommerceOrdersPage
      listOrders={commerceApi.listOrders}
      createOrder={commerceApi.createOrder}
      onRowClick={(row: OrderRow) => {
        router.push(`/platform/billing/orders/${encodeURIComponent(row._id)}`);
      }}
      onCreated={(id: string) => {
        router.push(`/platform/billing/orders/${encodeURIComponent(id)}`);
      }}
    />
  );
}
