import type {
  PluginContext,
  PluginDefinition,
  PluginSettingComponentProps,
} from "launchthat-plugin-core";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export interface CommercePluginComponents {
  CommerceStorefrontSettings: ComponentType<PluginSettingComponentProps>;
}

const STORE_ARCHIVE_TABS = [
  {
    value: "storefront",
    label: "Storefront",
    href: "/admin/edit?plugin=commerce&page=storefront",
  },
  {
    value: "products",
    label: "Products",
    href: "/admin/edit?post_type=products",
  },
  { value: "orders", label: "Orders", href: "/admin/edit?post_type=orders" },
  {
    value: "chargebacks",
    label: "Chargebacks",
    href: "/admin/edit?post_type=ecom-chargeback",
  },
  {
    value: "coupons",
    label: "Store Coupons",
    href: "/admin/edit?post_type=ecom-coupon",
  },
  {
    value: "plans",
    label: "Subscription Plans",
    href: "/admin/edit?post_type=plans",
  },
];

export const CommerceArchiveHeader = () => {
  return (
    <div className="border-border/80 bg-muted/40 rounded-lg border p-0">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="bg-background w-full flex-wrap justify-start gap-2 overflow-x-auto border-b px-4 py-3">
          {STORE_ARCHIVE_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              asChild
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Link href={tab.href}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

type ArchiveLayoutContext = "default" | "plugin" | "content-only";

const injectCommerceArchiveHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const typedContext = context as
    | { postType?: string; layout?: ArchiveLayoutContext }
    | undefined;

  const SUPPORTED_ARCHIVE_POST_TYPES = new Set([
    "products",
    "orders",
    "plans",
    "ecom-coupon",
    "ecom-chargeback",
  ]);

  const layout = typedContext?.layout ?? "default";
  const shouldRender =
    layout !== "content-only" &&
    !!typedContext?.postType &&
    SUPPORTED_ARCHIVE_POST_TYPES.has(typedContext.postType);

  if (!shouldRender) {
    return nodes;
  }

  return [...nodes, <CommerceArchiveHeader key="commerce-archive-header" />];
};

const injectCommerceSettingsHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const typedContext = context as
    | { pluginId?: string; pageSlug?: string }
    | undefined;

  if (typedContext?.pluginId !== "commerce") {
    return nodes;
  }

  return [...nodes, <CommerceArchiveHeader key="commerce-settings-header" />];
};

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
        icon: "Package",
        position: 40,
        parent: "plugin:commerce",
      },
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
      storageKind: "custom",
      storageTables: ["plans"],
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
      storageKind: "custom",
      storageTables: ["coupons"],
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
      storageKind: "custom",
      storageTables: ["chargebacks"],
      adminArchiveView: {
        showSidebar: false,
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
  hooks: {
    filters: [
      {
        hook: "admin.archive.header.before",
        priority: 10,
        acceptedArgs: 2,
        callback: injectCommerceArchiveHeader,
      },
      {
        hook: "admin.plugin.settings.header.before",
        priority: 10,
        acceptedArgs: 2,
        callback: injectCommerceSettingsHeader,
      },
    ],
  },
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
