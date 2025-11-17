"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  ORDER_TABS,
  STORE_TABS,
} from "~/components/admin/AdminLayout";
import { NavigationContext } from "~/components/admin/NavigationContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminStoreLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const baseUrl = "/admin/store";
  const ordersUrl = "/admin/store/orders";
  const productsUrl = "/admin/store/products";

  // Check if we're on a specific order page (has an ORDER_ID)
  const isSpecificOrderPage = () => {
    const orderIdPattern = new RegExp(`^${ordersUrl}/[^/]+$`);
    return orderIdPattern.test(pathname);
  };

  // Check if we're on a specific product page (has an PRODUCT_ID)
  const isSpecificProductPage = () => {
    // More specific pattern that excludes /categories and /tags
    const productIdPattern = new RegExp(
      `^${productsUrl}/(?!categories|tags)[^/]+$`,
    );
    return productIdPattern.test(pathname);
  };

  // Get page configuration based on current route
  const getPageConfig = () => {
    // Handle specific routes FIRST before generic patterns

    // Product Categories (must come before general products check)
    if (pathname.startsWith(`${baseUrl}/products/categories`)) {
      return {
        title: "Product Categories",
        description: "Organize your products with categories",
        showTabs: true,
        activeTab: "categories",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    // Product Tags (must come before general products check)
    if (pathname.startsWith(`${baseUrl}/products/tags`)) {
      return {
        title: "Product Tags",
        description: "Manage product tags and labels",
        showTabs: true,
        activeTab: "tags",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    // Specific Order Page
    if (isSpecificOrderPage()) {
      const orderId = pathname.split(`${ordersUrl}/`)[1];
      return {
        title: `Order ${orderId}`,
        description: `View and manage order details for ${orderId}`,
        showTabs: true,
        activeTab: "details", // Default to details tab for order pages
        tabs: ORDER_TABS, // Use order-specific tabs with client navigation
        navigationContext: NavigationContext.ENTITY_LEVEL,
      };
    }

    const PRODUCT_TABS = [
      {
        label: "Details",
        value: "details",
        navigationContext: NavigationContext.ENTITY_LEVEL,
      },
      {
        label: "Media",
        value: "media",
        navigationContext: NavigationContext.ENTITY_LEVEL,
      },
      {
        label: "SEO",
        value: "seo",
        navigationContext: NavigationContext.ENTITY_LEVEL,
      },
    ];

    // Specific Product Page
    if (isSpecificProductPage()) {
      const productId = pathname.split(`${productsUrl}/`)[1];
      return {
        title: `Product ${productId}`,
        description: `View and manage product details for ${productId}`,
        showTabs: true,
        activeTab: "details",
        tabs: PRODUCT_TABS,
        navigationContext: NavigationContext.ENTITY_LEVEL,
      };
    }

    // Default configurations for other pages - all use STORE_TABS with server navigation
    if (pathname === baseUrl) {
      return {
        title: "Store Dashboard",
        description: "Overview of your store performance and metrics",
        showTabs: true,
        activeTab: "dashboard",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/orders`)) {
      return {
        title: "Order Management",
        description: "Manage and track all store orders",
        showTabs: true,
        activeTab: "orders",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/products`)) {
      return {
        title: "Product Management",
        description: "Add, edit, and manage your store products",
        showTabs: true,
        activeTab: "products",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/chargebacks`)) {
      return {
        title: "Chargeback Management",
        description: "Handle and resolve payment chargebacks",
        showTabs: true,
        activeTab: "chargebacks",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/balances`)) {
      return {
        title: "Account Balances",
        description: "View your account balances and payouts",
        showTabs: true,
        activeTab: "balances",
        tabs: STORE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    const SETTINGS_TABS = [
      {
        label: "General",
        value: "general",
        navigationContext: NavigationContext.SECTION_LEVEL,
      },
      {
        label: "Payment",
        value: "payment",
        navigationContext: NavigationContext.SECTION_LEVEL,
      },
      {
        label: "Shipping",
        value: "shipping",
        navigationContext: NavigationContext.SECTION_LEVEL,
      },
      {
        label: "Tax",
        value: "tax",
        navigationContext: NavigationContext.SECTION_LEVEL,
      },
      {
        label: "Notifications",
        value: "notifications",
        navigationContext: NavigationContext.SECTION_LEVEL,
      },
    ];

    if (pathname.startsWith(`${baseUrl}/settings`)) {
      return {
        title: "Store Settings",
        description: "Manage your store settings",
        showTabs: true,
        activeTab: "general",
        tabs: SETTINGS_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    // Fallback
    return {
      title: "Store Management",
      description: "Manage your store orders, products, and settings",
      showTabs: true,
      activeTab: "dashboard",
      tabs: STORE_TABS,
      navigationContext: NavigationContext.SECTION_LEVEL,
    };
  };

  const pageConfig = getPageConfig();

  return (
    <AdminLayout
      title={pageConfig.title}
      description={pageConfig.description}
      showTabs={pageConfig.showTabs}
      activeTab={pageConfig.activeTab}
      tabs={pageConfig.tabs}
      baseUrl={baseUrl}
      pathname={pathname} // Enable auto-detection
      forceNavigationContext={pageConfig.navigationContext} // Override detection if needed
    >
      <AdminLayoutHeader />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminLayout>
  );
}
