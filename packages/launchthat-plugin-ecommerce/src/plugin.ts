import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";
import { ProductDetailsMetaBox } from "./admin/metaBoxes/ProductDetailsMetaBox";
import { OrderDetailsMetaBox } from "./admin/metaBoxes/OrderDetailsMetaBox";
import { OrderItemsMetaBox } from "./admin/metaBoxes/OrderItemsMetaBox";
import { EcommerceSettingsPage } from "./admin/settings/EcommerceSettingsPage";
import { EcommercePageSetupSettingsPage } from "./admin/settings/EcommercePageSetupSettingsPage";

export const PLUGIN_ID = "ecommerce" as const;
export type PluginId = typeof PLUGIN_ID;

const ECOMMERCE_COMPONENT_TABLES = [
  "launchthat_ecommerce:posts",
  "launchthat_ecommerce:postsMeta",
] as const;

export type CreateEcommercePluginDefinitionOptions = Record<string, never>;

const defaultOptions: CreateEcommercePluginDefinitionOptions = {};

export const createEcommercePluginDefinition = (
  _options: CreateEcommercePluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Ecommerce",
  description: "Storefront products and orders.",
  longDescription:
    "Adds a component-scoped ecommerce content layer (products + orders) backed by Convex Components.",
  features: ["Products post type", "Orders post type"],
  adminMenus: [
    {
      label: "Ecommerce",
      slug: "ecommerce",
      icon: "ShoppingCart",
      position: 40,
      group: "ecommerce",
    },
  ],
  postTypes: [
    {
      name: "Products",
      slug: "products",
      description: "Storefront products.",
      isPublic: true,
      enableApi: true,
      includeTimestamps: true,
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
        slug: "products",
        parent: "ecommerce",
        icon: "ShoppingBag",
        position: 40,
      },
      storageKind: "component",
      storageTables: [...ECOMMERCE_COMPONENT_TABLES],
      storageComponent: "launchthat_ecommerce",
      metaBoxes: [
        {
          id: "ecommerce-product-details",
          title: "Product details",
          description:
            "Configure pricing, inventory, shipping, and other product settings.",
          location: "main",
          priority: 5,
          fieldKeys: [],
          rendererKey: "ecommerce.product.details",
        },
      ],
      metaBoxRenderers: {
        "ecommerce.product.details": ProductDetailsMetaBox,
      },
    },
    {
      name: "Orders",
      slug: "orders",
      description: "Customer orders.",
      isPublic: false,
      enableApi: true,
      includeTimestamps: true,
      supports: {
        title: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
      },
      adminMenu: {
        enabled: true,
        label: "Orders",
        slug: "orders",
        parent: "ecommerce",
        icon: "Receipt",
        position: 41,
      },
      storageKind: "component",
      storageTables: [...ECOMMERCE_COMPONENT_TABLES],
      storageComponent: "launchthat_ecommerce",
      metaBoxes: [
        {
          id: "ecommerce-order-details",
          title: "Order details",
          description: "Review and update customer, billing, and shipping details.",
          location: "main",
          priority: 5,
          fieldKeys: [],
          rendererKey: "ecommerce.order.details",
        },
        {
          id: "ecommerce-order-items",
          title: "Order items",
          description: "Add products, update quantities, and recalculate totals.",
          location: "main",
          priority: 10,
          fieldKeys: [],
          rendererKey: "ecommerce.order.items",
        },
      ],
      metaBoxRenderers: {
        "ecommerce.order.details": OrderDetailsMetaBox,
        "ecommerce.order.items": OrderItemsMetaBox,
      },
    },
  ],
  fieldRegistrations: [
    {
      postTypeSlug: "products",
      fields: [
        {
          key: "product.type",
          name: "Product type",
          type: "select",
          options: [
            { label: "Simple product", value: "simple" },
            { label: "External / affiliate", value: "external" },
            { label: "Grouped product", value: "grouped" },
          ],
          defaultValue: "simple",
          readOnly: false,
        },
        {
          key: "product.regularPrice",
          name: "Regular price",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.salePrice",
          name: "Sale price",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.saleStartAt",
          name: "Sale schedule start",
          type: "datetime",
          readOnly: false,
        },
        {
          key: "product.saleEndAt",
          name: "Sale schedule end",
          type: "datetime",
          readOnly: false,
        },
        {
          key: "product.sku",
          name: "SKU",
          type: "text",
          readOnly: false,
        },
        {
          key: "product.manageStock",
          name: "Manage stock",
          type: "boolean",
          defaultValue: false,
          readOnly: false,
        },
        {
          key: "product.stockQuantity",
          name: "Stock quantity",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.stockStatus",
          name: "Stock status",
          type: "select",
          options: [
            { label: "In stock", value: "instock" },
            { label: "Out of stock", value: "outofstock" },
            { label: "On backorder", value: "onbackorder" },
          ],
          defaultValue: "instock",
          readOnly: false,
        },
        {
          key: "product.weight",
          name: "Weight",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.length",
          name: "Length",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.width",
          name: "Width",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.height",
          name: "Height",
          type: "number",
          readOnly: false,
        },
        {
          key: "product.upsells",
          name: "Up-sells",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "product.crossSells",
          name: "Cross-sells",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "product.attributesJson",
          name: "Attributes (JSON)",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "product.purchaseNote",
          name: "Purchase note",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "product.enableReviews",
          name: "Enable reviews",
          type: "boolean",
          defaultValue: false,
          readOnly: false,
        },
        {
          key: "product.menuOrder",
          name: "Menu order",
          type: "number",
          readOnly: false,
        },
      ],
    },
    {
      postTypeSlug: "orders",
      fields: [
        {
          key: "order.createdAt",
          name: "Date created",
          type: "datetime",
          readOnly: false,
        },
        {
          key: "order.status",
          name: "Order status",
          type: "select",
          options: [
            { label: "Pending payment", value: "pending" },
            { label: "Processing", value: "processing" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Refunded", value: "refunded" },
            { label: "Failed", value: "failed" },
          ],
          defaultValue: "pending",
          readOnly: false,
        },
        {
          key: "order.customerEmail",
          name: "Customer email",
          type: "text",
          readOnly: false,
        },
        {
          key: "order.paymentMethod",
          name: "Payment method",
          type: "text",
          readOnly: false,
        },
        {
          key: "order.notes",
          name: "Order notes",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "order.itemsJson",
          name: "Order items (JSON)",
          description:
            "Internal: JSON encoded line items array used by the Order items meta box.",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "order.itemsSubtotal",
          name: "Items subtotal",
          type: "number",
          readOnly: false,
        },
        {
          key: "order.orderTotal",
          name: "Order total",
          type: "number",
          readOnly: false,
        },
        {
          key: "order.currency",
          name: "Currency",
          type: "text",
          defaultValue: "USD",
          readOnly: false,
        },
        {
          key: "order.couponCode",
          name: "Coupon code",
          type: "text",
          readOnly: false,
        },

        { key: "billing.name", name: "Billing name", type: "text", readOnly: false },
        { key: "billing.email", name: "Billing email", type: "text", readOnly: false },
        { key: "billing.phone", name: "Billing phone", type: "text", readOnly: false },
        {
          key: "billing.address1",
          name: "Billing address line 1",
          type: "text",
          readOnly: false,
        },
        {
          key: "billing.address2",
          name: "Billing address line 2",
          type: "text",
          readOnly: false,
        },
        { key: "billing.city", name: "Billing city", type: "text", readOnly: false },
        { key: "billing.state", name: "Billing state", type: "text", readOnly: false },
        {
          key: "billing.postcode",
          name: "Billing postcode",
          type: "text",
          readOnly: false,
        },
        {
          key: "billing.country",
          name: "Billing country",
          type: "text",
          readOnly: false,
        },

        { key: "shipping.name", name: "Shipping name", type: "text", readOnly: false },
        { key: "shipping.phone", name: "Shipping phone", type: "text", readOnly: false },
        {
          key: "shipping.address1",
          name: "Shipping address line 1",
          type: "text",
          readOnly: false,
        },
        {
          key: "shipping.address2",
          name: "Shipping address line 2",
          type: "text",
          readOnly: false,
        },
        { key: "shipping.city", name: "Shipping city", type: "text", readOnly: false },
        { key: "shipping.state", name: "Shipping state", type: "text", readOnly: false },
        {
          key: "shipping.postcode",
          name: "Shipping postcode",
          type: "text",
          readOnly: false,
        },
        {
          key: "shipping.country",
          name: "Shipping country",
          type: "text",
          readOnly: false,
        },
      ],
    },
  ],
  settingsPages: [
    {
      id: "ecommerce-page-setup",
      slug: "page-setup",
      label: "Page setup",
      description: "Choose which pages are used for cart and checkout.",
      render: (props) => createElement(EcommercePageSetupSettingsPage, props),
    },
    {
      id: "ecommerce-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure ecommerce defaults and checkout behavior.",
      render: (props) => createElement(EcommerceSettingsPage, props),
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
});

export const ecommercePlugin: PluginDefinition =
  createEcommercePluginDefinition();
