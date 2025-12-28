import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";
import {
  ADMIN_ARCHIVE_HEADER_BEFORE,
  ADMIN_PLUGIN_SETTINGS_HEADER_BEFORE,
} from "launchthat-plugin-core/hookSlots";

import { registerCommerceAdminMetaBoxes } from "./admin/metaBoxes";
import { CommerceStorefrontSettings } from "./admin/settings/CommerceStorefrontSettings";
import OrderAnalyticsPage from "./admin/store/orders/analytics/page";
import ProductsAdminPage from "./admin/store/page";
import {
  injectCommerceArchiveHeader,
  injectCommerceSettingsHeader,
} from "./commerceHooks";

export const PLUGIN_ID = "commerce" as const;

export const COMMERCE_COMPONENT_TABLES: Array<string> = [
  "launchthat_ecommerce.posts",
  "launchthat_ecommerce.postsMeta",
];

export const createCommercePluginDefinition = (): PluginDefinition => ({
  id: PLUGIN_ID,
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
  admin: {
    bootstrap: registerCommerceAdminMetaBoxes,
  },
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
        icon: "Package",
        position: 40,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
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
        icon: "Receipt",
        position: 41,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
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
        enabled: true,
        label: "Plans",
        icon: "Layers3",
        position: 45,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
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
        enabled: true,
        label: "Coupons",
        icon: "Ticket",
        position: 46,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
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
        enabled: true,
        label: "Chargebacksss",
        icon: "ShieldAlert",
        position: 47,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
    },
    {
      name: "Balances",
      slug: "ecom-balance",
      description: "Aggregated balance snapshots for payouts and settlements.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: true,
        label: "Balances",
        icon: "Wallet",
        position: 48,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
    },
    {
      name: "Transfers",
      slug: "ecom-transfer",
      description: "Money movement records for payouts and internal transfers.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: true,
        label: "Transfers",
        icon: "ArrowLeftRight",
        position: 49,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
    },
    {
      name: "Chargeback Evidence",
      slug: "ecom-chargeback-evidence",
      description: "Evidence packages and documents linked to chargebacks.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      supports: {
        title: true,
        customFields: true,
      },
      adminMenu: {
        enabled: false,
        label: "Chargeback Evidence",
        icon: "FileText",
        position: 50,
        parent: "plugin:commerce",
      },
      storageKind: "component",
      storageTables: COMMERCE_COMPONENT_TABLES,
      adminArchiveView: {
        showSidebar: false,
      },
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  settingsPages: [
    {
      id: "commerce-dashboard",
      slug: "commerce-dashboard",
      label: "Commerce Dashboard",
      description: "Ecommerce store dashboard.",
      render: () => createElement(ProductsAdminPage),
    },
    {
      id: "commerce-analytics",
      slug: "analytics",
      label: "Analytics",
      description: "Store performance analytics.",
      render: () => createElement(OrderAnalyticsPage),
    },
    {
      id: "commerce-settings",
      slug: "settings",
      label: "Settings",
      description: "Ecommerce store settings.",
      render: (props) => createElement(CommerceStorefrontSettings, props),
    },
  ],
  hooks: {
    filters: [
      {
        hook: ADMIN_ARCHIVE_HEADER_BEFORE,
        priority: 10,
        acceptedArgs: 2,
        callback: injectCommerceArchiveHeader,
      },
      {
        hook: ADMIN_PLUGIN_SETTINGS_HEADER_BEFORE,
        priority: 10,
        acceptedArgs: 2,
        callback: injectCommerceSettingsHeader,
      },
    ],
  },
});

export const commercePlugin: PluginDefinition =
  createCommercePluginDefinition();
