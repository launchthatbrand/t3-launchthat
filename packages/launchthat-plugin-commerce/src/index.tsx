import type {
  PluginContext,
  PluginDefinition,
  PluginSettingComponentProps,
} from "launchthat-plugin-core";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { ScrollArea, ScrollBar } from "@acme/ui/scroll-area";
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
    value: "plans",
    label: "Subscriptions",
    href: "/admin/edit?post_type=plans",
  },
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
    value: "balances",
    label: "Balances",
    href: "/admin/edit?post_type=ecom-balance",
  },
  {
    value: "transfers",
    label: "Transfers",
    href: "/admin/edit?post_type=ecom-transfer",
  },
];

interface CommerceArchiveHeaderProps {
  activeTab?: string;
}
export interface Artwork {
  artist: string;
  art: string;
}
export const works: Artwork[] = [
  {
    artist: "Ornella Binni",
    art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Tom Byrom",
    art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Vladimir Malyavko",
    art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
  },
];

const getValidTabValue = (value?: string) => {
  if (!value) return undefined;
  return STORE_ARCHIVE_TABS.some((tab) => tab.value === value)
    ? value
    : undefined;
};

export const CommerceArchiveHeader = ({
  activeTab,
}: CommerceArchiveHeaderProps) => {
  const resolvedValue = getValidTabValue(activeTab) ?? "products";
  console.log("resolvedValue", resolvedValue);

  return (
    // <Tabs
    //   value={resolvedValue}
    //   onValueChange={() => {
    //     // Tabs are driven by navigation links; ignore internal state updates.
    //   }}
    //   className="w-full"
    // >
    //   <TabsList className="bg-background w-full flex-wrap justify-start gap-1 overflow-x-auto border-b">
    //     {STORE_ARCHIVE_TABS.map((tab) => (
    //       <TabsTrigger
    //         key={tab.value}
    //         value={tab.value}
    //         asChild
    //         className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
    //       >
    //         <Link href={tab.href} className="">
    //           {tab.label}
    //         </Link>
    //       </TabsTrigger>
    //     ))}
    //   </TabsList>
    // </Tabs>
    <div className="bg-muted flex w-full flex-col gap-6">
      <Tabs value={resolvedValue}>
        {/* <ScrollArea className="w-full rounded-md border whitespace-nowrap">
         
        </ScrollArea> */}
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="rounded-none p-0 pt-2">
            {STORE_ARCHIVE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="data-[state=active]:border-b-primary data-[state=active]:border-b"
              >
                <Link
                  href={tab.href}
                  className="h-full rounded-xs data-[state=active]:border-b-2"
                >
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar
            orientation="horizontal"
            className="primary flex h-[5px]"
            style={{ "--border": "#bababa" } as React.CSSProperties}
          />
        </ScrollArea>
      </Tabs>
    </div>
  );
};

type ArchiveLayoutContext = "default" | "plugin" | "content-only";

const POST_TYPE_TO_TAB: Record<string, string> = {
  products: "products",
  orders: "orders",
  plans: "plans",
  "ecom-coupon": "coupons",
  "ecom-chargeback": "chargebacks",
  "ecom-balance": "balances",
  "ecom-transfer": "transfers",
};

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
    "ecom-balance",
    "ecom-transfer",
    "ecom-chargeback-evidence",
  ]);

  const layout = typedContext?.layout ?? "default";
  const shouldRender =
    layout !== "content-only" &&
    !!typedContext?.postType &&
    SUPPORTED_ARCHIVE_POST_TYPES.has(typedContext.postType);

  if (!shouldRender) {
    return nodes;
  }

  const activeTab = POST_TYPE_TO_TAB[typedContext?.postType ?? ""];

  return [
    ...nodes,
    <CommerceArchiveHeader
      key="commerce-archive-header"
      activeTab={activeTab}
    />,
  ];
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

  const activeTab =
    typedContext?.pageSlug === "storefront" ? "storefront" : undefined;

  return [
    ...nodes,
    <CommerceArchiveHeader
      key="commerce-settings-header"
      activeTab={activeTab}
    />,
  ];
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
      storageKind: "custom",
      storageTables: ["orders"],
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
      storageKind: "custom",
      storageTables: ["balances"],
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
      storageKind: "custom",
      storageTables: ["transfers"],
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
      storageKind: "custom",
      storageTables: ["chargebackEvidence"],
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
export { ChargebackForm } from "./admin/components/chargebacks/ChargebackForm";
export {
  OrderForm,
  type OrderFormData,
  type OrderLineItem,
} from "./admin/components/orders/OrderForm";
