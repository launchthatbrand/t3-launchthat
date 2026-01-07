"use client";

import type { ReactNode} from "react";
import React, { createContext, useContext } from "react";

// Navigation context types
export enum NavigationContext {
  SECTION_LEVEL = "section", // Store, Users, Content (server nav)
  ENTITY_LEVEL = "entity", // Order details, Product edit (client nav)
  PLUGIN_DEFINED = "plugin", // Plugin chooses
}

// Enhanced tab configuration with navigation context
export interface TabConfig {
  value: string;
  label: string;
  href?: string; // For server-side navigation (Next.js Link)
  onClick?: string | (() => void); // For client-side navigation (JavaScript function or hash)
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  navigationContext?: NavigationContext;
  order?: number; // For explicit tab ordering (lower numbers appear first)
}

// Plugin registration interface
export interface PluginTabRegistration {
  id: string;
  section?: string; // For section-level plugins
  entity?: string; // For entity-level plugins
  tab: TabConfig;
  component?: React.ComponentType<unknown>;
  priority?: number; // For ordering
}

// Navigation context value
interface NavigationContextValue {
  currentContext: NavigationContext;
  currentSection?: string;
  currentEntity?: string;
  currentEntityId?: string;
  registeredPlugins: PluginTabRegistration[];
  registerPlugin: (plugin: PluginTabRegistration) => void;
  unregisterPlugin: (pluginId: string) => void;
  getPluginsForContext: (
    context: NavigationContext,
    target?: string,
  ) => PluginTabRegistration[];
}

// Context creation
const NavigationCtx = createContext<NavigationContextValue | undefined>(
  undefined,
);

// Hook for using navigation context
export const useNavigationContext = () => {
  const context = useContext(NavigationCtx);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within NavigationProvider",
    );
  }
  return context;
};

// Navigation detection utility
export const detectNavigationContext = (
  pathname: string,
  entityPatterns: RegExp[] = [],
): NavigationContext => {
  // Check for entity-level patterns (specific IDs in URLs)
  for (const pattern of entityPatterns) {
    if (pattern.test(pathname)) {
      return NavigationContext.ENTITY_LEVEL;
    }
  }

  // Default to section-level navigation
  return NavigationContext.SECTION_LEVEL;
};

// Plugin registry class
class PluginRegistry {
  private static plugins: PluginTabRegistration[] = [];

  static register(plugin: PluginTabRegistration) {
    // Remove existing plugin with same ID
    this.plugins = this.plugins.filter((p) => p.id !== plugin.id);
    // Add new plugin
    this.plugins.push(plugin);
    // Sort by priority
    this.plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  static unregister(pluginId: string) {
    this.plugins = this.plugins.filter((p) => p.id !== pluginId);
  }

  static getPlugins() {
    return [...this.plugins];
  }

  static getPluginsForContext(context: NavigationContext, target?: string) {
    return this.plugins.filter((plugin) => {
      if (context === NavigationContext.SECTION_LEVEL) {
        return plugin.section === target;
      } else if (context === NavigationContext.ENTITY_LEVEL) {
        return plugin.entity === target;
      }
      return plugin.tab.navigationContext === context;
    });
  }
}

// Navigation provider props
interface NavigationProviderProps {
  children: ReactNode;
  currentContext: NavigationContext;
  currentSection?: string;
  currentEntity?: string;
  currentEntityId?: string;
}

// Navigation provider component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  currentContext,
  currentSection,
  currentEntity,
  currentEntityId,
}) => {
  const [registeredPlugins, setRegisteredPlugins] = React.useState<
    PluginTabRegistration[]
  >(PluginRegistry.getPlugins());

  const registerPlugin = React.useCallback((plugin: PluginTabRegistration) => {
    PluginRegistry.register(plugin);
    setRegisteredPlugins(PluginRegistry.getPlugins());
  }, []);

  const unregisterPlugin = React.useCallback((pluginId: string) => {
    PluginRegistry.unregister(pluginId);
    setRegisteredPlugins(PluginRegistry.getPlugins());
  }, []);

  const getPluginsForContext = React.useCallback(
    (context: NavigationContext, target?: string) => {
      return PluginRegistry.getPluginsForContext(context, target);
    },
    [],
  );

  const contextValue: NavigationContextValue = {
    currentContext,
    currentSection,
    currentEntity,
    currentEntityId,
    registeredPlugins,
    registerPlugin,
    unregisterPlugin,
    getPluginsForContext,
  };

  return (
    <NavigationCtx.Provider value={contextValue}>
      {children}
    </NavigationCtx.Provider>
  );
};

// Export the registry for direct access if needed
export { PluginRegistry };

// Pre-built entity patterns for common use cases
export const ENTITY_PATTERNS = {
  ORDER_DETAIL: /^\/admin\/store\/orders\/[^/]+$/,
  PRODUCT_DETAIL: /^\/admin\/store\/products\/[^/]+$/,
  USER_DETAIL: /^\/admin\/users\/[^/]+$/,
  // Add more patterns as needed
};

// Utility function to get entity info from pathname
export const getEntityInfo = (pathname: string) => {
  // Order details
  const orderPattern = /^\/admin\/store\/orders\/([^/]+)$/;
  const orderMatch = orderPattern.exec(pathname);
  if (orderMatch) {
    return {
      entity: "order",
      entityId: orderMatch[1],
      section: "store",
    };
  }

  // Product details
  const productPattern = /^\/admin\/store\/products\/([^/]+)$/;
  const productMatch = productPattern.exec(pathname);
  if (productMatch) {
    return {
      entity: "product",
      entityId: productMatch[1],
      section: "store",
    };
  }

  // User details
  const userPattern = /^\/admin\/users\/([^/]+)$/;
  const userMatch = userPattern.exec(pathname);
  if (userMatch) {
    return {
      entity: "user",
      entityId: userMatch[1],
      section: "users",
    };
  }

  return null;
};

// Section detection utility
export const getSectionFromPathname = (
  pathname: string,
): string | undefined => {
  const sectionPattern = /^\/admin\/([^/]+)/;
  const sectionMatch = sectionPattern.exec(pathname);
  return sectionMatch?.[1];
};
