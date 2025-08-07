import React from "react";

// Plugin context interface
export interface PluginContext {
  postType?: string;
  postId?: string;
  userId?: string;
  isSubmitting?: boolean;
  formData?: unknown;
  [key: string]: unknown;
}

// Tab plugin definition
export interface PluginTab {
  id: string;
  label: string;
  component: React.ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

// Sidebar plugin definition
export interface PluginSidebar {
  position: "top" | "bottom" | "replace";
  component: React.ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
}

// Slot component definition
export interface PluginSlot {
  component: React.ComponentType<PluginContext>;
  condition?: (context: PluginContext) => boolean;
  order?: number;
}

// Main plugin interface
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;

  // Plugin capabilities
  tabs?: PluginTab[];
  sidebar?: PluginSidebar[];
  slots?: Record<string, PluginSlot[]>;

  // Lifecycle hooks
  onActivate?: (context: PluginContext) => void | Promise<void>;
  onDeactivate?: (context: PluginContext) => void | Promise<void>;

  // Plugin configuration
  config?: Record<string, unknown>;

  // Plugin dependencies
  dependencies?: string[];

  // Target areas where this plugin can be used
  areas?: string[];
}

// Plugin registry events
export interface PluginRegistryEvents {
  "plugin:registered": { plugin: Plugin };
  "plugin:activated": { plugin: Plugin; context: PluginContext };
  "plugin:deactivated": { plugin: Plugin; context: PluginContext };
  "plugin:error": { plugin: Plugin; error: Error; context?: PluginContext };
}

// Plugin registry configuration
export interface PluginRegistryConfig {
  enabledPlugins?: string[];
  pluginConfigs?: Record<string, unknown>;
}

export default Plugin;
