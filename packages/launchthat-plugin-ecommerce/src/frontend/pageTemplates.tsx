import React from "react";

import { EcommerceCartTemplate } from "./templates/EcommerceCartTemplate";
import { EcommerceCheckoutTemplate } from "./templates/EcommerceCheckoutTemplate";

export type EcommercePageTemplateDefinition = {
  slug: string;
  label: string;
  description?: string;
  layout?: {
    showHeader?: boolean;
    showSidebar?: boolean;
    container?: "default" | "wide" | "full";
  };
  order?: number;
  render: (ctx: any) => React.ReactNode;
};

export const getEcommercePageTemplates =
  (): EcommercePageTemplateDefinition[] => {
    return [
      {
        slug: "ecommerce-cart",
        label: "Ecommerce: Cart",
        description: "Dedicated cart page (rendered by the Ecommerce plugin).",
        layout: { showHeader: true, showSidebar: true, container: "default" },
        order: 50,
        render: (ctx) => <EcommerceCartTemplate ctx={ctx} />,
      },
      {
        slug: "ecommerce-checkout",
        label: "Ecommerce: Checkout",
        description:
          "Dedicated checkout page (rendered by the Ecommerce plugin).",
        layout: { showHeader: false, showSidebar: false, container: "full" },
        order: 51,
        render: (ctx) => <EcommerceCheckoutTemplate ctx={ctx} />,
      },
    ];
  };
