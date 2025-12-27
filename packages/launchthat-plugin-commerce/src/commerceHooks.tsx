import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { ScrollArea, ScrollBar } from "@acme/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

interface CommerceTab {
  value: string;
  label: string;
  href: string;
}

const STORE_ARCHIVE_TABS: CommerceTab[] = [
  {
    value: "dashboard",
    label: "Dashboard",
    href: "/admin/edit?plugin=commerce&page=commerce-dashboard",
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
  {
    value: "analytics",
    label: "Analytics",
    href: "/admin/edit?plugin=commerce&page=analytics",
  },
  {
    value: "settings",
    label: "Settings",
    href: "/admin/edit?plugin=commerce&page=settings",
  },
];

interface CommerceArchiveHeaderProps {
  activeTab?: string;
  tabs?: CommerceTab[];
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

const getValidTabValue = (value: string | undefined, tabs: CommerceTab[]) => {
  if (!value) return undefined;
  return tabs.some((tab) => tab.value === value) ? value : undefined;
};

export const CommerceArchiveHeader = ({
  activeTab,
  tabs: providedTabs,
}: CommerceArchiveHeaderProps) => {
  const tabs = providedTabs?.length ? providedTabs : STORE_ARCHIVE_TABS;
  const resolvedValue =
    getValidTabValue(activeTab, tabs) ?? tabs[0]?.value ?? "products";

  return (
    <div className="bg-muted flex w-full flex-col gap-6">
      <Tabs value={resolvedValue}>
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="rounded-none p-0 pt-2">
            {tabs.map((tab) => (
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
            style={{ "--border": "#bababa" } as CSSProperties}
          />
        </ScrollArea>
      </Tabs>
    </div>
  );
};

type ArchiveLayoutContext = "default" | "plugin" | "content-only";
type PluginMenuItem = { id: string; label: string; href: string };
type PluginMenuMap = Record<string, PluginMenuItem[]>;

const COMMERCE_PLUGIN_ID = "commerce";

const buildTabsFromMenu = (items?: PluginMenuItem[]): CommerceTab[] => {
  if (!items?.length) {
    return [];
  }
  return items.map((item) => ({
    value: item.id,
    label: item.label,
    href: item.href,
  }));
};

const POST_TYPE_TO_TAB: Record<string, string> = {
  products: "products",
  orders: "orders",
  plans: "plans",
  "ecom-coupon": "coupons",
  "ecom-chargeback": "chargebacks",
  "ecom-balance": "balances",
  "ecom-transfer": "transfers",
};

const SETTINGS_PAGE_TO_TAB: Record<string, string> = {
  "commerce-dashboard": "dashboard",
  analytics: "analytics",
  settings: "settings",
};

export const injectCommerceArchiveHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const typedContext = context as
    | {
        postType?: string;
        layout?: ArchiveLayoutContext;
        pluginMenus?: PluginMenuMap;
      }
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

  const menuTabs = buildTabsFromMenu(
    typedContext?.pluginMenus?.[COMMERCE_PLUGIN_ID],
  );
  const desiredTabId = typedContext?.postType
    ? `postType:${typedContext.postType}`
    : undefined;
  const hasMenuMatch = desiredTabId
    ? menuTabs.some((tab) => tab.value === desiredTabId)
    : false;
  const activeTab = hasMenuMatch
    ? desiredTabId
    : POST_TYPE_TO_TAB[typedContext?.postType ?? ""];

  return [
    ...nodes,
    <CommerceArchiveHeader
      key="commerce-archive-header"
      activeTab={activeTab}
      tabs={menuTabs.length > 0 ? menuTabs : undefined}
    />,
  ];
};

export const injectCommerceSettingsHeader = (
  value: unknown,
  context?: unknown,
): ReactNode[] => {
  const nodes = Array.isArray(value) ? [...(value as ReactNode[])] : [];
  const typedContext = context as
    | {
        pluginId?: string;
        pageSlug?: string;
        pluginMenus?: PluginMenuMap;
      }
    | undefined;

  if (typedContext?.pluginId !== COMMERCE_PLUGIN_ID) {
    return nodes;
  }

  const menuTabs = buildTabsFromMenu(
    typedContext?.pluginMenus?.[COMMERCE_PLUGIN_ID],
  );
  const desiredTabId = typedContext?.pageSlug
    ? `plugin:${COMMERCE_PLUGIN_ID}:${typedContext.pageSlug}`
    : undefined;
  const hasMenuMatch = desiredTabId
    ? menuTabs.some((tab) => tab.value === desiredTabId)
    : false;
  const fallbackTab =
    typedContext?.pageSlug && SETTINGS_PAGE_TO_TAB[typedContext.pageSlug]
      ? SETTINGS_PAGE_TO_TAB[typedContext.pageSlug]
      : undefined;
  const activeTab = hasMenuMatch ? desiredTabId : fallbackTab;

  return [
    ...nodes,
    <CommerceArchiveHeader
      key="commerce-settings-header"
      activeTab={activeTab}
      tabs={menuTabs.length > 0 ? menuTabs : undefined}
    />,
  ];
};
