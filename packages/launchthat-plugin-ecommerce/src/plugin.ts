import type { PluginDefinition } from "launchthat-plugin-core";
import { createElement } from "react";

import { FunnelStepSettingsMetaBox } from "./admin/metaBoxes/FunnelStepSettingsMetaBox";
import { FunnelStepsMetaBox } from "./admin/metaBoxes/FunnelStepsMetaBox";
import { OrderDetailsMetaBox } from "./admin/metaBoxes/OrderDetailsMetaBox";
import { OrderItemsMetaBox } from "./admin/metaBoxes/OrderItemsMetaBox";
import { ProductDetailsMetaBox } from "./admin/metaBoxes/ProductDetailsMetaBox";
import { EcommercePageSetupSettingsPage } from "./admin/settings/EcommercePageSetupSettingsPage";
import { EcommerceSettingsPage } from "./admin/settings/EcommerceSettingsPage";
import { EcommerceAccountOrdersTab } from "./frontend/account/EcommerceAccountOrdersTab";
import { CheckoutClient } from "./frontend/ui/CheckoutClient";

export const PLUGIN_ID = "ecommerce" as const;
export type PluginId = typeof PLUGIN_ID;

const ECOMMERCE_COMPONENT_TABLES = [
  "launchthat_ecommerce:posts",
  "launchthat_ecommerce:postsMeta",
] as const;

export interface EcommerceFrontendOverrides {
  productsSingleRender?: (props: any) => React.ReactNode;
}

export interface CreateEcommercePluginDefinitionOptions {
  frontend?: EcommerceFrontendOverrides;
}

const defaultOptions: CreateEcommercePluginDefinitionOptions = {};

export const createEcommercePluginDefinition = (
  options: CreateEcommercePluginDefinitionOptions = defaultOptions,
): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Ecommerce",
  description: "Storefront products and orders.",
  longDescription:
    "Adds a component-scoped ecommerce content layer (products + orders) backed by Convex Components.",
  features: ["Products post type", "Orders post type", "Funnels + steps"],
  hooks: {
    filters: [
      {
        hook: "frontend.route.handlers",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (value: any, ctx: any) => {
          const handlers = Array.isArray(value) ? value : [];
          return [
            ...handlers,
            {
              id: "ecommerce:funnel-step",
              // Must run before core single-post routing (priority 10), otherwise a core
              // page with slug "checkout" can win and canonicalize /f/.../checkout → /checkout.
              priority: 5,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              resolve: async (routeCtx: any) => {
                const enabledPluginIds = Array.isArray(routeCtx?.enabledPluginIds)
                  ? (routeCtx.enabledPluginIds as string[])
                  : [];
                if (!enabledPluginIds.includes(PLUGIN_ID)) {
                  return null;
                }

                const segmentsRaw = Array.isArray(routeCtx?.segments)
                  ? (routeCtx.segments as unknown[])
                  : [];
                const segments = segmentsRaw
                  .map((s) => (typeof s === "string" ? s : ""))
                  .filter(Boolean);

                // Handle: /f/:funnelSlug/:stepSlug
                if (!(segments.length >= 3 && segments[0] === "f")) return null;
                const funnelSlug = String(segments[1] ?? "").trim();
                const stepSlug = String(segments[2] ?? "").trim();
                if (!funnelSlug || !stepSlug) return null;

                const fetchQuery = routeCtx?.fetchQuery;
                const api = routeCtx?.api;
                if (typeof fetchQuery !== "function" || !api) return null;

                const orgIdRaw = routeCtx?.organizationId;
                const organizationId =
                  typeof orgIdRaw === "string" ? orgIdRaw : undefined;

                const step: any = await fetchQuery(
                  api.plugins.commerce.funnelSteps.queries.getFunnelStepBySlug,
                  {
                    funnelSlug,
                    stepSlug,
                    ...(organizationId ? { organizationId } : {}),
                  },
                );
                if (!step) return null;

                const orderIdParam = routeCtx?.searchParams?.orderId;
                const orderId =
                  typeof orderIdParam === "string"
                    ? orderIdParam
                    : Array.isArray(orderIdParam)
                      ? orderIdParam[0]
                      : undefined;

                return createElement(
                  "main",
                  { className: "bg-background min-h-screen" },
                  createElement(CheckoutClient as any, {
                    organizationId,
                    funnelId:
                      typeof step?.funnelId === "string" ? step.funnelId : undefined,
                    funnelSlug:
                      typeof step?.funnelSlug === "string"
                        ? step.funnelSlug
                        : undefined,
                    stepId:
                      typeof step?.stepId === "string" ? step.stepId : undefined,
                    stepSlug:
                      typeof step?.stepSlug === "string" ? step.stepSlug : undefined,
                    stepKind:
                      typeof step?.kind === "string" ? step.kind : undefined,
                    orderId: typeof orderId === "string" ? orderId : undefined,
                  }),
                );
              },
            },
          ];
        },
        priority: 10,
        acceptedArgs: 2,
      },
      {
        hook: "frontend.account.tabs",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: (value: any, ctx: any) => {
          const tabs = Array.isArray(value) ? value : [];
          const enabledPluginIds = Array.isArray(ctx?.enabledPluginIds)
            ? (ctx.enabledPluginIds as string[])
            : [];
          if (!enabledPluginIds.includes(PLUGIN_ID)) {
            return tabs;
          }

          const organizationId =
            ctx && typeof ctx === "object" && "organizationId" in ctx
              ? (ctx as { organizationId?: unknown }).organizationId
              : undefined;

          return [
            ...tabs,
            {
              id: "ecommerce-account-orders",
              label: "Orders",
              value: "orders",
              order: 20,
              render: () =>
                createElement(EcommerceAccountOrdersTab, {
                  organizationId:
                    typeof organizationId === "string"
                      ? organizationId
                      : undefined,
                }),
            },
          ];
        },
        priority: 10,
        acceptedArgs: 2,
      },
    ],
  },
  postStatuses: [
    {
      value: "unpaid",
      label: "Unpaid",
      description: "Order created but not yet paid.",
      postTypeSlugs: ["orders"],
    },
    {
      value: "paid",
      label: "Paid",
      description: "Payment captured successfully.",
      postTypeSlugs: ["orders"],
    },
    {
      value: "failed",
      label: "Failed",
      description: "Payment failed or was declined.",
      postTypeSlugs: ["orders"],
    },
  ],
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
        comments: true,
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
      ...(options.frontend?.productsSingleRender
        ? {
            frontend: {
              single: {
                render: options.frontend.productsSingleRender as any,
              },
            },
          }
        : {}),
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
          description:
            "Review and update customer, billing, and shipping details.",
          location: "main",
          priority: 5,
          fieldKeys: ["order.userId"],
          rendererKey: "ecommerce.order.details",
        },
        {
          id: "ecommerce-order-items",
          title: "Order items",
          description:
            "Add products, update quantities, and recalculate totals.",
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
    {
      name: "Funnels",
      slug: "funnels",
      description: "Checkout funnels (container).",
      isPublic: false,
      enableApi: true,
      includeTimestamps: true,
      supports: {
        title: true,
        excerpt: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
      },
      adminMenu: {
        enabled: true,
        label: "Funnels",
        slug: "funnels",
        parent: "ecommerce",
        icon: "Workflow",
        position: 42,
      },
      storageKind: "component",
      storageTables: [...ECOMMERCE_COMPONENT_TABLES],
      storageComponent: "launchthat_ecommerce",
      metaBoxes: [
        {
          id: "ecommerce-funnel-steps",
          title: "Funnel steps",
          description:
            "Manage the ordered steps inside this funnel (checkout, thank you, upsells).",
          location: "main",
          priority: 5,
          fieldKeys: [],
          rendererKey: "ecommerce.funnel.steps",
        },
      ],
      metaBoxRenderers: {
        "ecommerce.funnel.steps": FunnelStepsMetaBox,
      },
    },
    {
      name: "Funnel Steps",
      slug: "funnel_steps",
      description: "Individual funnel steps (checkout, thank you, upsell).",
      isPublic: true,
      enableApi: true,
      includeTimestamps: true,
      supports: {
        title: true,
        excerpt: true,
        editor: true,
        customFields: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
      },
      adminMenu: {
        enabled: false,
      },
      storageKind: "component",
      storageTables: [...ECOMMERCE_COMPONENT_TABLES],
      storageComponent: "launchthat_ecommerce",
      metaBoxes: [
        {
          id: "ecommerce-funnel-step-settings",
          title: "Step settings",
          description: "Configure what this step is and how it behaves.",
          location: "main",
          priority: 5,
          fieldKeys: [],
          rendererKey: "ecommerce.funnelStep.settings",
        },
      ],
      metaBoxRenderers: {
        "ecommerce.funnelStep.settings": FunnelStepSettingsMetaBox,
      },
    },
  ],
  fieldRegistrations: [
    {
      postTypeSlug: "funnel_steps",
      fields: [
        {
          key: "step.funnelId",
          name: "Funnel ID",
          description: "System-owned. Do not edit.",
          type: "text",
          readOnly: true,
        },
        {
          key: "step.funnelSlug",
          name: "Funnel slug",
          description: "System-owned. Used for permalink previews.",
          type: "text",
          readOnly: true,
        },
        {
          key: "step.isDefaultFunnel",
          name: "Is default funnel",
          description: "System-owned. Used for permalink previews.",
          type: "boolean",
          readOnly: true,
        },
      ],
    },
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
          key: "product.isVirtual",
          name: "Virtual product",
          description: "If enabled, this product does not require shipping.",
          type: "boolean",
          defaultValue: false,
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
          key: "order.userId",
          name: "Assigned user id",
          description:
            "Internal. Convex users._id for the assigned customer account.",
          type: "text",
          readOnly: false,
        },
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

        {
          key: "billing.name",
          name: "Billing name",
          type: "text",
          readOnly: false,
        },
        {
          key: "billing.email",
          name: "Billing email",
          type: "text",
          readOnly: false,
        },
        {
          key: "billing.phone",
          name: "Billing phone",
          type: "text",
          readOnly: false,
        },
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
        {
          key: "billing.city",
          name: "Billing city",
          type: "text",
          readOnly: false,
        },
        {
          key: "billing.state",
          name: "Billing state",
          type: "text",
          readOnly: false,
        },
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

        {
          key: "shipping.name",
          name: "Shipping name",
          type: "text",
          readOnly: false,
        },
        {
          key: "shipping.phone",
          name: "Shipping phone",
          type: "text",
          readOnly: false,
        },
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
        {
          key: "shipping.city",
          name: "Shipping city",
          type: "text",
          readOnly: false,
        },
        {
          key: "shipping.state",
          name: "Shipping state",
          type: "text",
          readOnly: false,
        },
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
    {
      postTypeSlug: "funnels",
      fields: [
        {
          key: "funnel.isDefault",
          name: "Default funnel",
          description:
            "Internal: marks the funnel whose checkout step is rendered at /checkout.",
          type: "boolean",
          readOnly: false,
        },
      ],
    },
    {
      postTypeSlug: "funnel_steps",
      fields: [
        {
          key: "step.funnelId",
          name: "Funnel ID",
          description: "Internal: parent funnel identifier.",
          type: "text",
          readOnly: false,
        },
        {
          key: "step.kind",
          name: "Step kind",
          description: "Checkout, thank you, upsell, etc.",
          type: "select",
          options: [
            { label: "Checkout", value: "checkout" },
            { label: "Thank you", value: "thankYou" },
            { label: "Upsell", value: "upsell" },
          ],
          defaultValue: "checkout",
          readOnly: false,
        },
        {
          key: "step.order",
          name: "Step order",
          description: "Internal: sorting order within the funnel.",
          type: "number",
          readOnly: false,
        },
        {
          key: "step.checkout.design",
          name: "Checkout design",
          description:
            "Select which checkout layout to use (checkout steps only).",
          type: "select",
          options: [
            { label: "Default", value: "default" },
            { label: "Minimal", value: "minimal" },
            { label: "Sidebar", value: "sidebar" },
          ],
          defaultValue: "default",
          readOnly: false,
        },
        {
          key: "step.checkout.predefinedProductsJson",
          name: "Predefined products (JSON)",
          description:
            "Internal: JSON encoded list of product IDs to auto-add/replace cart when entering this checkout step.",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "step.thankYou.headline",
          name: "Thank you headline",
          description: "Headline shown on thank you steps.",
          type: "text",
          readOnly: false,
        },
        {
          key: "step.thankYou.body",
          name: "Thank you body",
          description: "Body content shown on thank you steps.",
          type: "textarea",
          readOnly: false,
        },
        {
          key: "step.upsell.offerProductPostIdsJson",
          name: "Upsell offer products (JSON)",
          description:
            "Internal: JSON encoded list of product IDs offered on this upsell step.",
          type: "textarea",
          readOnly: false,
        },
      ],
    },
  ],
  settingsPages: [
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
