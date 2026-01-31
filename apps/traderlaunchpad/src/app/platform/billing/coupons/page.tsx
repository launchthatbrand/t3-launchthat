 "use client";
 
import { EcommerceCouponsPage } from "launchthat-plugin-ecommerce/admin";
import { api } from "@convex-config/_generated/api";
 
 export default function PlatformBillingCouponsPage() {
  return (
    <EcommerceCouponsPage
      listDiscountCodes={api.platform.ecommerce.listDiscountCodes}
      createDiscountCode={api.platform.ecommerce.createDiscountCode}
      updateDiscountCode={api.platform.ecommerce.updateDiscountCode}
      deleteDiscountCode={api.platform.ecommerce.deleteDiscountCode}
    />
  );
 }
