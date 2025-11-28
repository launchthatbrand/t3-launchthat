"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Import the new navigation context
import type { TabConfig } from "./NavigationContext";
import {
  detectNavigationContext,
  ENTITY_PATTERNS,
  getEntityInfo,
  getSectionFromPathname,
  NavigationContext,
} from "./NavigationContext";

// Context for sharing admin layout state
interface AdminLayoutContextValue {
  title: string;
  description: string;
  showTabs: boolean;
  activeTab?: string;
  tabs?: TabConfig[];
  baseUrl?: string;
  navigationContext: NavigationContext;
  setActiveTab?: (tabValue: string) => void; // Add tab state management
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | undefined>(
  undefined,
);

const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error("useAdminLayout must be used within AdminLayout");
  }
  return context;
};

// Enhanced tab rendering component
interface TabsRendererProps {
  tabs: TabConfig[];
  activeTab?: string;
  className?: string;
}

const TabsRenderer: React.FC<TabsRendererProps> = ({
  tabs,
  activeTab,
  className = "flex w-auto items-start justify-start",
}) => {
  const { setActiveTab } = useAdminLayout();

  const renderTab = (tab: TabConfig) => {
    // Handle server-side navigation with href
    if (tab.href) {
      return (
        <TabsTrigger key={tab.value} value={tab.value} asChild>
          <Link href={tab.href}>
            {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
            {tab.label}
          </Link>
        </TabsTrigger>
      );
    }

    // Handle client-side navigation with onClick
    if (tab.onClick) {
      const handleClick = () => {
        if (typeof tab.onClick === "string") {
          // Handle hash navigation or custom string actions
          if (tab.onClick.startsWith("#")) {
            const element = document.querySelector(tab.onClick);
            element?.scrollIntoView({ behavior: "smooth" });
          } else {
            // Could handle other string-based actions here
            console.warn("Unsupported onClick string action:", tab.onClick);
          }
        } else if (typeof tab.onClick === "function") {
          // Handle function-based actions
          tab.onClick();
        }
      };

      return (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          onClick={handleClick}
          disabled={tab.disabled}
        >
          {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
          {tab.label}
        </TabsTrigger>
      );
    }

    // Default: Controlled tab switching (for entity-level navigation)
    const handleTabClick = () => {
      setActiveTab?.(tab.value);
    };

    return (
      <TabsTrigger
        key={tab.value}
        value={tab.value}
        onClick={handleTabClick}
        disabled={tab.disabled}
      >
        {tab.icon && <tab.icon className="mr-2 h-4 w-4" />}
        {tab.label}
      </TabsTrigger>
    );
  };

  if (tabs.length === 0) return null;

  return (
    <Tabs value={activeTab} className={className}>
      <TabsList className="flex w-auto items-start justify-start">
        {tabs.map(renderTab)}
      </TabsList>
    </Tabs>
  );
};

// Component that handles the admin layout logic
interface AdminLayoutInnerProps extends AdminLayoutProps {
  detectedContext: NavigationContext;
  _entityInfo: ReturnType<typeof getEntityInfo>;
  _currentSection: string | undefined;
}

const AdminLayoutInner: React.FC<AdminLayoutInnerProps> = ({
  children,
  title,
  description,
  showTabs,
  activeTab,
  tabs,
  baseUrl,
  detectedContext,
  _entityInfo,
  _currentSection,
}) => {
  // Add state management for controlled tabs
  const [currentActiveTab, setCurrentActiveTab] = React.useState(activeTab);

  // Update local state when activeTab prop changes
  React.useEffect(() => {
    setCurrentActiveTab(activeTab);
  }, [activeTab]);

  // For now, we'll work without the navigation context
  // This can be enhanced later when NavigationProvider is consistently used
  const contextPlugins = React.useMemo<{ tab: TabConfig }[]>(() => [], []);

  // Merge provided tabs with plugin tabs
  const allTabs = React.useMemo(() => {
    const pluginTabs = contextPlugins.map((plugin) => plugin.tab);
    const combinedTabs = [...(tabs ?? []), ...pluginTabs];

    return combinedTabs
      .map((tab, index) => ({ tab, originalIndex: index })) // Preserve original order
      .sort((a, b) => {
        const aOrder = a.tab.order;
        const bOrder = b.tab.order;

        // If both have explicit order, sort by order
        if (aOrder !== undefined && bOrder !== undefined) {
          return aOrder - bOrder;
        }

        // If only one has explicit order, prioritize it
        if (aOrder !== undefined) return -1;
        if (bOrder !== undefined) return 1;

        // If neither has explicit order, preserve original array order
        return a.originalIndex - b.originalIndex;
      })
      .map(({ tab }) => tab); // Extract just the tab objects
  }, [tabs, contextPlugins]);

  const contextValue: AdminLayoutContextValue = {
    title,
    description,
    showTabs: showTabs ?? true,
    activeTab: currentActiveTab,
    tabs: allTabs,
    baseUrl,
    navigationContext: detectedContext,
    setActiveTab: setCurrentActiveTab,
  };

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      {children}
    </AdminLayoutContext.Provider>
  );
};

// Main AdminLayout component with auto-detection
interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  showTabs?: boolean;
  activeTab?: string;
  tabs?: TabConfig[];
  baseUrl?: string;
  pathname?: string; // For auto-detection
  forceNavigationContext?: NavigationContext; // Override auto-detection
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  description,
  showTabs = true,
  activeTab,
  tabs = [],
  baseUrl,
  pathname,
  forceNavigationContext,
}) => {
  // Auto-detect navigation context if not forced
  const detectedContext = React.useMemo(() => {
    if (forceNavigationContext) return forceNavigationContext;
    if (!pathname) return NavigationContext.SECTION_LEVEL;

    return detectNavigationContext(pathname, Object.values(ENTITY_PATTERNS));
  }, [pathname, forceNavigationContext]);

  // Get entity and section info
  const entityInfo = React.useMemo(() => {
    if (!pathname) return null;
    return getEntityInfo(pathname);
  }, [pathname]);

  const currentSection = React.useMemo(() => {
    if (!pathname) return undefined;
    return getSectionFromPathname(pathname);
  }, [pathname]);

  return (
    <AdminLayoutInner
      title={title}
      description={description}
      showTabs={showTabs}
      activeTab={activeTab}
      tabs={tabs}
      baseUrl={baseUrl}
      detectedContext={detectedContext}
      _entityInfo={entityInfo}
      _currentSection={currentSection}
    >
      {children}
    </AdminLayoutInner>
  );
};

// Header component that auto-selects navigation type
interface AdminLayoutHeaderProps {
  className?: string;
  contentClassName?: string;
  customTabs?: TabConfig[]; // Override tabs
}

const AdminLayoutHeader: React.FC<AdminLayoutHeaderProps> = ({
  className = "space-y-6 rounded-none bg-muted/50 shadow-sm",
  contentClassName = "",
  customTabs,
}) => {
  const router = useRouter();
  const {
    title,
    description,
    showTabs,
    activeTab,
    tabs: contextTabs = [],
  } = useAdminLayout();

  const finalTabs = customTabs ?? contextTabs;
  const finalShowTabs = showTabs && finalTabs.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="container flex flex-col flex-wrap items-start justify-start gap-4 py-6">
        <div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </CardHeader>
      {finalShowTabs && (
        <CardContent
          className={`container items-start justify-start ${contentClassName}`}
        >
          <TabsRenderer tabs={finalTabs} activeTab={activeTab} />
        </CardContent>
      )}
    </Card>
  );
};

// AdminLayoutContent - Updated to support sidebar layout
interface AdminLayoutContentProps {
  children: ReactNode;
  className?: string;
  withSidebar?: boolean; // New prop to enable sidebar layout
}

const AdminLayoutContent: React.FC<AdminLayoutContentProps> = ({
  children,
  className = "",
  withSidebar = false,
}) => {
  if (withSidebar) {
    // Grid layout for sidebar + main content
    return <div className={`grid md:grid-cols-4 ${className}`}>{children}</div>;
  }

  // Original single-column layout
  return <div className={`w-full ${className}`}>{children}</div>;
};

// AdminLayoutMain - Main content area (when using sidebar layout)
interface AdminLayoutMainProps {
  children: ReactNode;
  className?: string;
}

const AdminLayoutMain = React.forwardRef<HTMLDivElement, AdminLayoutMainProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={`TEST md:col-span-3 ${className}`} {...props}>
        <Card className="border-none p-0 shadow-none">
          <CardContent className="p-0">{children}</CardContent>
        </Card>
      </div>
    );
  },
);
AdminLayoutMain.displayName = "AdminLayoutMain";

// AdminLayoutSidebar - Sidebar area
interface AdminLayoutSidebarProps {
  children: ReactNode;
  className?: string;
}

const AdminLayoutSidebar = React.forwardRef<
  HTMLDivElement,
  AdminLayoutSidebarProps
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={`md:col-span-1 ${className}`} {...props}>
      {children}
    </div>
  );
});
AdminLayoutSidebar.displayName = "AdminLayoutSidebar";

// Export everything
export {
  AdminLayout,
  AdminLayoutHeader,
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
  useAdminLayout,
  TabsRenderer,
};

// Re-export types for convenience
export type {
  TabConfig,
  AdminLayoutProps,
  AdminLayoutHeaderProps,
  AdminLayoutContentProps,
};

// Export pre-built tab configurations
export const STORE_TABS: TabConfig[] = [
  { value: "dashboard", label: "Dashboard", href: "/admin/store" },
  { value: "orders", label: "Orders", href: "/admin/store/orders" },
  { value: "products", label: "Products", href: "/admin/store/products" },
  {
    value: "categories",
    label: "Categories",
    href: "/admin/store/products/categories",
  },
  { value: "tags", label: "Tags", href: "/admin/store/products/tags" },
  {
    value: "chargebacks",
    label: "Chargebacks",
    href: "/admin/store/chargebacks",
  },
  { value: "balances", label: "Balances", href: "/admin/store/balances" },
  { value: "settings", label: "Settings", href: "/admin/store/settings" },
];

// Example: Users management tabs
export const USERS_TABS: TabConfig[] = [
  { value: "users", label: "All Users", href: "/admin/users" },
  { value: "roles", label: "Roles", href: "/admin/users/roles" },
  {
    value: "permissions",
    label: "Permissions",
    href: "/admin/users/permissions",
  },
];

// Example: Content management tabs
export const CONTENT_TABS: TabConfig[] = [
  { value: "posts", label: "Posts", href: "/admin/content/posts" },
  { value: "pages", label: "Pages", href: "/admin/content/pages" },
  { value: "media", label: "Media", href: "/admin/content/media" },
];

// Function to create order-specific tabs (call from within components)
export const createOrderTabs = (_orderId?: string): TabConfig[] => [
  {
    value: "details",
    label: "Order Details",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
  {
    value: "media",
    label: "Media",
    navigationContext: NavigationContext.ENTITY_LEVEL,
  },
];

// Static order tabs for simple usage
export const ORDER_TABS: TabConfig[] = createOrderTabs();
