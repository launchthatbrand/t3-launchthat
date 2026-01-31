 "use client";
 
import { EcommerceProductsPage } from "launchthat-plugin-ecommerce/admin";
import { api } from "@convex-config/_generated/api";
 
 export default function PlatformBillingProductsPage() {
  return (
    <EcommerceProductsPage
      listProducts={api.platform.ecommerce.listProducts}
      createProduct={api.platform.ecommerce.createProduct}
    />
  );
 }
