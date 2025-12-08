"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export enum NavigationContext {
  SECTION_LEVEL = "section",
  ENTITY_LEVEL = "entity",
}

export type TabConfig = {
  value: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

type NavigationProviderValue = {
  context: NavigationContext;
};

const NavigationCtx = createContext<NavigationProviderValue | undefined>(
  undefined,
);

export const useNavigationContext = () => {
  const ctx = useContext(NavigationCtx);
  if (!ctx) {
    throw new Error(
      "useNavigationContext must be used within NavigationContextProvider",
    );
  }
  return ctx;
};

export const NavigationContextProvider = ({
  value,
  children,
}: {
  value: NavigationProviderValue;
  children: ReactNode;
}) => {
  return (
    <NavigationCtx.Provider value={value}>{children}</NavigationCtx.Provider>
  );
};

export const STORE_TABS: TabConfig[] = [
  { value: "dashboard", label: "Dashboard", href: "/admin/store" },
  { value: "products", label: "Products", href: "/admin/store/products" },
  { value: "orders", label: "Orders", href: "/admin/store/orders" },
  { value: "balances", label: "Balances", href: "/admin/store/balances" },
  {
    value: "chargebacks",
    label: "Chargebacks",
    href: "/admin/store/chargebacks",
  },
  { value: "plans", label: "Plans", href: "/admin/store/plans" },
  { value: "settings", label: "Settings", href: "/admin/store/settings" },
];

export const ORDER_TABS: TabConfig[] = [
  { value: "details", label: "Details" },
  { value: "line-items", label: "Line Items" },
  { value: "transactions", label: "Transactions" },
  { value: "history", label: "History" },
];
