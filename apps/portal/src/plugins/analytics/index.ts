// Analytics Plugin - WordPress-style hook registration
import { BarChart3 } from "lucide-react";

import type { HookContext, PluginSidebar, PluginTab } from "~/lib/hooks";
import { addAction } from "~/lib/hooks";
import { AnalyticsTab, AnalyticsWidget } from "./components";

// Register Analytics Tab for Product post type only
addAction(
  "admin.post.tabs",
  (...args: unknown[]) => {
    const [tabs, context] = args as [PluginTab[], HookContext];

    // Only add to products
    if (context.postType === "product") {
      tabs.push({
        id: "analytics",
        label: "Analytics",
        component: AnalyticsTab,
        order: 20, // After content (10) and media (15)
        icon: BarChart3,
        condition: (context: HookContext) => context.postType === "product",
      });
    }
  },
  10,
  2,
);

// Register Analytics Sidebar Widget for Products
addAction(
  "admin.post.sidebar.top",
  (...args: unknown[]) => {
    const [sidebarItems, context] = args as [PluginSidebar[], HookContext];

    // Only add to products
    if (context.postType === "product") {
      sidebarItems.push({
        id: "analytics-widget",
        component: AnalyticsWidget,
        order: 5, // Show near the top
        position: "top",
        condition: (context: HookContext) => context.postType === "product",
      });
    }
  },
  10,
  2,
);

console.log(
  "🔌 Analytics Plugin loaded - adds Analytics tab to Product admin pages",
);
