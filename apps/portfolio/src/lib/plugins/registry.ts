import type {
  Plugin,
  PluginContext,
  PluginRegistryConfig,
  PluginRegistryEvents,
  PluginTab,
} from "./types";

import { EventEmitter } from "events";

class PluginRegistry extends EventEmitter {
  private plugins = new Map<string, Plugin>();
  private activePlugins = new Set<string>();
  private config: PluginRegistryConfig = {};

  constructor(config?: PluginRegistryConfig) {
    super();
    this.config = { enabledPlugins: [], pluginConfigs: {}, ...config };
  }

  // Plugin management
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    // Validate plugin dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(
            `Plugin "${plugin.id}" requires dependency "${depId}" which is not registered`,
          );
        }
      }
    }

    this.plugins.set(plugin.id, plugin);
    this.emit("plugin:registered", { plugin });

    // Auto-activate if in enabled list
    if (this.config.enabledPlugins?.includes(plugin.id)) {
      this.activate(plugin.id);
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Deactivate first
    if (this.activePlugins.has(pluginId)) {
      this.deactivate(pluginId);
    }

    // Check for dependents
    const dependents = Array.from(this.plugins.values()).filter((p) =>
      p.dependencies?.includes(pluginId),
    );

    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister plugin "${pluginId}" - it is required by: ${dependents.map((p) => p.id).join(", ")}`,
      );
    }

    this.plugins.delete(pluginId);
  }

  async activate(pluginId: string, context?: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" is not registered`);
    }

    if (this.activePlugins.has(pluginId)) {
      return; // Already active
    }

    try {
      // Activate dependencies first
      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          await this.activate(depId, context);
        }
      }

      // Call plugin activation hook
      if (plugin.onActivate) {
        await plugin.onActivate(context || {});
      }

      this.activePlugins.add(pluginId);
      this.emit("plugin:activated", { plugin, context: context || {} });
    } catch (error) {
      this.emit("plugin:error", { plugin, error: error as Error, context });
      throw error;
    }
  }

  async deactivate(pluginId: string, context?: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !this.activePlugins.has(pluginId)) {
      return;
    }

    try {
      // Call plugin deactivation hook
      if (plugin.onDeactivate) {
        await plugin.onDeactivate(context || {});
      }

      this.activePlugins.delete(pluginId);
      this.emit("plugin:deactivated", { plugin, context: context || {} });
    } catch (error) {
      this.emit("plugin:error", { plugin, error: error as Error, context });
      throw error;
    }
  }

  // Plugin discovery methods
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) =>
      this.activePlugins.has(plugin.id),
    );
  }

  isPluginActive(pluginId: string): boolean {
    return this.activePlugins.has(pluginId);
  }

  // Content discovery methods
  getSlotComponents(
    slotName: string,
    context: PluginContext,
  ): React.ComponentType<PluginContext>[] {
    const components: Array<{
      component: React.ComponentType<PluginContext>;
      order: number;
    }> = [];

    for (const plugin of this.getActivePlugins()) {
      const slots = plugin.slots?.[slotName];
      if (!slots) continue;

      for (const slot of slots) {
        // Check condition
        if (slot.condition && !slot.condition(context)) continue;

        // Check area restriction
        if (
          plugin.areas &&
          context.postType &&
          !plugin.areas.includes(context.postType)
        )
          continue;

        components.push({
          component: slot.component,
          order: slot.order ?? 0,
        });
      }
    }

    // Sort by order and return components
    return components
      .sort((a, b) => a.order - b.order)
      .map((item) => item.component);
  }

  getTabsForArea(area: string, context: PluginContext): PluginTab[] {
    const tabs: PluginTab[] = [];

    for (const plugin of this.getActivePlugins()) {
      if (!plugin.tabs) continue;

      // Check area restriction
      if (plugin.areas && !plugin.areas.includes(area)) continue;

      for (const tab of plugin.tabs) {
        // Check condition
        if (tab.condition && !tab.condition(context)) continue;

        tabs.push(tab);
      }
    }

    // Sort by order
    return tabs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getSidebarComponents(
    position: "top" | "bottom",
    context: PluginContext,
  ): React.ComponentType<PluginContext>[] {
    const components: Array<{
      component: React.ComponentType<PluginContext>;
      order: number;
    }> = [];

    for (const plugin of this.getActivePlugins()) {
      if (!plugin.sidebar) continue;

      for (const sidebar of plugin.sidebar) {
        // Check position and condition
        if (sidebar.position !== position) continue;
        if (sidebar.condition && !sidebar.condition(context)) continue;

        // Check area restriction
        if (
          plugin.areas &&
          context.postType &&
          !plugin.areas.includes(context.postType)
        )
          continue;

        components.push({
          component: sidebar.component,
          order: sidebar.order ?? 0,
        });
      }
    }

    // Sort by order and return components
    return components
      .sort((a, b) => a.order - b.order)
      .map((item) => item.component);
  }

  // Configuration methods
  updateConfig(config: Partial<PluginRegistryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getPluginConfig(pluginId: string): unknown {
    return this.config.pluginConfigs?.[pluginId];
  }

  setPluginConfig(pluginId: string, config: unknown): void {
    if (!this.config.pluginConfigs) {
      this.config.pluginConfigs = {};
    }
    this.config.pluginConfigs[pluginId] = config;
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry();

// Event type declarations for TypeScript
declare interface PluginRegistry {
  on<K extends keyof PluginRegistryEvents>(
    event: K,
    listener: (args: PluginRegistryEvents[K]) => void,
  ): this;

  emit<K extends keyof PluginRegistryEvents>(
    event: K,
    args: PluginRegistryEvents[K],
  ): boolean;
}

export default PluginRegistry;
