import type {
  PluginDefinition,
  PluginSettingComponentProps,
} from "launchthat-plugin-core";
import type { ComponentType } from "react";

export interface CommercePluginComponents {
  CommerceStorefrontSettings: ComponentType<PluginSettingComponentProps>;
}

export const createCommercePluginDefinition = ({
  CommerceStorefrontSettings,
}: CommercePluginComponents): PluginDefinition => ({
  id: "commerce",
  name: "Ecommerce",
  description: "Products, orders and catalog components.",
  longDescription:
    "Sell digital or physical products. Adds product + order post types with store specific settings.",
  features: [
    "Products, orders, coupons",
    "Inventory hooks",
    "Catalog API endpoints",
    "Admin store sidebar items",
  ],
  postTypes: [
    {
      name: "Products",
      slug: "products",
      description: "Shoppable catalog entries.",
      isPublic: true,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        featuredImage: true,
        customFields: true,
        postMeta: true,
        taxonomy: true,
      },
      rewrite: {
        hasArchive: true,
        archiveSlug: "store",
        singleSlug: "product",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: true,
        label: "Products",
        slug: "store/products",
        icon: "Package",
        position: 40,
      },
    },
    {
      name: "Orders",
      slug: "orders",
      description: "Order records stored as entries.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "order",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: true,
        label: "Orders",
        slug: "store/orders",
        icon: "Receipt",
        position: 41,
      },
    },
  ],
  settingsPages: [
    {
      id: "commerce-storefront",
      slug: "storefront",
      label: "Storefront",
      description: "Currency, shipping and checkout defaults.",
      render: (props) => <CommerceStorefrontSettings {...props} />,
    },
  ],
});

export default createCommercePluginDefinition;

export {
  CommerceProvider,
  useCommerceApi,
  useCommerceAuth,
  useCommerceClient,
  useCommerceMutation,
  useCommerceQuery,
} from "./context/CommerceClientProvider";
