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
        attachments: true,
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
    {
      name: "Subscription Plans",
      slug: "plans",
      description: "Defines the subscription tiers available to organizations.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["plans"],
    },
    {
      name: "Store Coupons",
      slug: "ecom-coupon",
      description: "Discount codes and promotions for the ecommerce store.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["coupons"],
    },
    {
      name: "Chargebacks",
      slug: "ecom-chargeback",
      description: "Chargeback disputes, evidence packages, and resolutions.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "custom",
      storageTables: ["chargebacks"],
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
  adminMenus: [
    {
      label: "Plans",
      slug: "store/plans",
      icon: "Layers3",
      group: "shop",
      position: 45,
    },
    {
      label: "Coupons",
      slug: "store/coupons",
      icon: "Ticket",
      group: "shop",
      position: 46,
    },
    {
      label: "Chargebacks",
      slug: "store/chargebacks",
      icon: "ShieldAlert",
      group: "shop",
      position: 47,
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
export * from "./components";
export { StoreSystem } from "./admin/store/StoreSystem";
