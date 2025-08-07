"use client";

import React from "react";
import { Settings } from "lucide-react";

import { NavigationContext, PluginRegistry } from "../NavigationContext";

// Example plugin component
const ExampleOrderSettings: React.ComponentType<unknown> = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Order Settings</h3>
      <p className="text-muted-foreground">
        This is an example plugin that adds a settings tab to order pages.
      </p>
      <div className="rounded-md border p-4">
        <h4 className="font-medium">Plugin Content</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          This content would be rendered when the "Settings" tab is active.
        </p>
      </div>
    </div>
  );
};

// Example store analytics plugin
const ExampleStoreAnalytics: React.ComponentType<unknown> = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Advanced Analytics</h3>
      <p className="text-muted-foreground">
        This is an example plugin that adds analytics to the store section.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4">
          <h4 className="font-medium">Revenue Metrics</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Plugin-provided revenue analytics would go here.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h4 className="font-medium">Customer Insights</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Plugin-provided customer insights would go here.
          </p>
        </div>
      </div>
    </div>
  );
};

// Plugin registration function
export const registerExamplePlugins = () => {
  // Register an entity-level plugin for orders
  PluginRegistry.register({
    id: "example-order-settings",
    entity: "order", // This will appear on order detail pages
    tab: {
      value: "settings",
      label: "Settings",
      icon: Settings,
      onClick: "#settings",
      navigationContext: NavigationContext.ENTITY_LEVEL,
    },
    component: ExampleOrderSettings,
    priority: 5, // Lower priority = appears later
  });

  // Register a section-level plugin for store
  PluginRegistry.register({
    id: "example-store-analytics",
    section: "store", // This will appear in store navigation
    tab: {
      value: "analytics",
      label: "Analytics",
      href: "/admin/store/analytics",
      navigationContext: NavigationContext.SECTION_LEVEL,
    },
    component: ExampleStoreAnalytics,
    priority: 10, // Higher priority = appears earlier
  });
};

// Auto-register when this module is imported
// In a real plugin system, this would be called by the plugin loader
registerExamplePlugins();

export { ExampleOrderSettings, ExampleStoreAnalytics };
