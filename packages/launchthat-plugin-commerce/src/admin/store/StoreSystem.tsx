"use client";

import type { GenericId as Id } from "convex/values";
import type { ComponentType } from "react";
import { useMemo } from "react";
import Link from "next/link";

import { StoreRouteProvider } from "./StoreRouteContext";
import {
  StoreBalancesView,
  StoreChargebackDetailView,
  StoreChargebacksView,
  StoreDashboardView,
  StoreOrderDetailView,
  StoreOrdersAnalyticsView,
  StoreOrdersNewView,
  StoreOrdersSettingsView,
  StoreOrdersView,
  StorePlansView,
  StoreProductCreateView,
  StoreProductDetailView,
  StoreProductEditView,
  StoreProductsCatalogView,
  StoreProductsView,
  StoreSettingsView,
  StoreTransferDetailView,
  StoreTransfersView,
} from "./views";

const NAV_LINKS = [
  { label: "Dashboard", slug: "" },
  { label: "Products", slug: "products" },
  { label: "Orders", slug: "orders" },
  { label: "Balances", slug: "balances" },
  { label: "Chargebacks", slug: "chargebacks" },
  { label: "Plans", slug: "plans" },
  { label: "Settings", slug: "settings" },
];

type RouteMatch = {
  match: (segments: string[]) => boolean;
  component: ComponentType;
};

const ROUTES: RouteMatch[] = [
  { match: (s) => s.length === 0, component: StoreDashboardView },

  // products
  {
    match: (s) => s[0] === "products" && s.length === 1,
    component: StoreProductsView,
  },
  {
    match: (s) => s[0] === "products" && s[1] === "catalog",
    component: StoreProductsCatalogView,
  },
  {
    match: (s) => s[0] === "products" && s[1] === "create",
    component: StoreProductCreateView,
  },
  {
    match: (s) => s[0] === "products" && s[1] === "edit" && !!s[2],
    component: StoreProductEditView,
  },
  {
    match: (s) =>
      s[0] === "products" &&
      !!s[1] &&
      !["catalog", "create", "edit"].includes(s[1]),
    component: StoreProductDetailView,
  },

  // orders
  {
    match: (s) => s[0] === "orders" && s.length === 1,
    component: StoreOrdersView,
  },
  {
    match: (s) => s[0] === "orders" && s[1] === "new",
    component: StoreOrdersNewView,
  },
  {
    match: (s) => s[0] === "orders" && s[1] === "analytics",
    component: StoreOrdersAnalyticsView,
  },
  {
    match: (s) => s[0] === "orders" && s[1] === "settings",
    component: StoreOrdersSettingsView,
  },
  {
    match: (s) =>
      s[0] === "orders" &&
      !!s[1] &&
      !["new", "analytics", "settings"].includes(s[1]),
    component: StoreOrderDetailView,
  },

  {
    match: (s) => s[0] === "balances" && s.length === 1,
    component: StoreBalancesView,
  },
  {
    match: (s) => s[0] === "balances" && s[1] === "transfers" && s.length === 2,
    component: StoreTransfersView,
  },
  {
    match: (s) => s[0] === "balances" && s[1] === "transfers" && !!s[2],
    component: StoreTransferDetailView,
  },

  {
    match: (s) => s[0] === "chargebacks" && s.length === 1,
    component: StoreChargebacksView,
  },
  {
    match: (s) => s[0] === "chargebacks" && !!s[1],
    component: StoreChargebackDetailView,
  },

  // {
  //   match: (s) => s[0] === "checkouts" && s.length === 1,
  //   component: StoreFunnelsView,
  // },
  // {
  //   match: (s) => s[0] === "checkouts" && !!s[1],
  //   component: StoreFunnelDetailView,
  // },

  // {
  //   match: (s) => s[0] === "funnels" && s.length === 1,
  //   component: StoreFunnelsView,
  // },
  // {
  //   match: (s) => s[0] === "funnels" && !!s[1] && s.length === 2,
  //   component: StoreFunnelDetailView,
  // },
  // {
  //   match: (s) =>
  //     s[0] === "funnels" && !!s[1] && s[2] === "steps" && s.length === 3,
  //   component: StoreFunnelStepsView,
  // },
  // {
  //   match: (s) => s[0] === "funnels" && !!s[1] && s[2] === "steps" && !!s[3],
  //   component: StoreFunnelStepDetailView,
  // },

  { match: (s) => s[0] === "plans", component: StorePlansView },
  { match: (s) => s[0] === "settings", component: StoreSettingsView },
];

interface StoreSystemProps {
  organizationId?: Id<string>;
  tenantName?: string;
  params?: { segments?: string[] };
  searchParams?: Record<string, string | string[] | undefined>;
  currentUser?: {
    id: string;
    name?: string;
    imageUrl?: string;
  };
}

export function StoreSystem({ params, searchParams }: StoreSystemProps) {
  const segments = params?.segments ?? [];

  const ActiveComponent = useMemo<ComponentType>(() => {
    const match = ROUTES.find((route) => route.match(segments));
    return match?.component ?? StoreDashboardView;
  }, [segments]);

  const activeSlug = segments[0] ?? "";

  return (
    <StoreRouteProvider segments={segments} searchParams={searchParams}>
      <div className="flex h-full flex-col">
        <StoreNav activeSlug={activeSlug} />
        <div className="bg-background flex-1 overflow-y-auto p-4">
          <ActiveComponent />
        </div>
      </div>
    </StoreRouteProvider>
  );
}

const StoreNav = ({ activeSlug }: { activeSlug: string }) => (
  <div className="bg-background border-b px-4">
    <nav className="flex h-11 items-center gap-4 text-sm font-medium">
      {NAV_LINKS.map((link) => {
        const href = link.slug ? `/admin/store/${link.slug}` : "/admin/store";
        const isActive = activeSlug === link.slug;
        return (
          <Link
            key={link.slug || "dashboard"}
            href={href}
            className={`transition-colors ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  </div>
);
