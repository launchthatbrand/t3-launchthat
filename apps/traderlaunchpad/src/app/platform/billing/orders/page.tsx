 "use client";
 
import { EcommerceOrdersPage } from "launchthat-plugin-ecommerce/admin";
import { api } from "@convex-config/_generated/api";
 
 export default function PlatformBillingOrdersPage() {
  return (
    <EcommerceOrdersPage
      listOrders={api.platform.ecommerce.listOrders}
      createOrder={api.platform.ecommerce.createOrder}
    />
  );
 }
