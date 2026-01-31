 "use client";

import { useRouter } from "next/navigation";
import { EcommerceProductsPage } from "launchthat-plugin-ecommerce/admin";
import { api } from "@convex-config/_generated/api";

interface ProductRow {
  _id: string;
}

export default function PlatformBillingProductsPage() {
  const router = useRouter();
  const commerceApi = (
    api as unknown as {
      platform: {
        ecommerce: {
          listProducts: unknown;
          createProduct: unknown;
        };
      };
    }
  ).platform.ecommerce;

  return (
    <EcommerceProductsPage
      listProducts={commerceApi.listProducts}
      createProduct={commerceApi.createProduct}
      onRowClick={(row: ProductRow) => {
        router.push(`/platform/billing/products/${encodeURIComponent(row._id)}`);
      }}
      onCreated={(id: string) => {
        router.push(`/platform/billing/products/${encodeURIComponent(id)}`);
      }}
    />
  );
}
