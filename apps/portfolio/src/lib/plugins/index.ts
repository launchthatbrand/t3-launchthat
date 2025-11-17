import type { Plugin, PluginContext } from "./types";

import { analyticsPlugin } from "./examples/analytics-plugin";
import { pluginRegistry } from "./registry";

// Core plugin types
export type {
  Plugin,
  PluginContext,
  PluginTab,
  PluginSidebar,
  PluginSlot,
  PluginRegistryConfig,
  PluginRegistryEvents,
} from "./types";

// Plugin registry
export { default as PluginRegistry, pluginRegistry } from "./registry";

// React hooks
export {
  useActivePlugins,
  useSlotComponents,
  usePluginTabs,
  useSidebarComponents,
  useIsPluginActive,
  usePluginActivation,
} from "./hooks";

// React components
export { Slot } from "./components/Slot";
export { PluginManager } from "./components/PluginManager";

// Example plugins
export { analyticsPlugin } from "./examples/analytics-plugin";

// Plugin registration helper
export const registerPlugin = (plugin: Plugin) => {
  pluginRegistry.register(plugin);
};

// Auto-register example plugins
// Register the analytics plugin on module load
registerPlugin(analyticsPlugin);

// Plugin activation helpers
export const activatePlugin = async (
  pluginId: string,
  context?: PluginContext,
) => {
  await pluginRegistry.activate(pluginId, context);
};

export const deactivatePlugin = async (
  pluginId: string,
  context?: PluginContext,
) => {
  await pluginRegistry.deactivate(pluginId, context);
};

// Plugin discovery helpers
export const getActivePlugins = () => {
  return pluginRegistry.getActivePlugins();
};

export const getPlugin = (pluginId: string) => {
  return pluginRegistry.getPlugin(pluginId);
};

export const isPluginActive = (pluginId: string) => {
  return pluginRegistry.isPluginActive(pluginId);
};
