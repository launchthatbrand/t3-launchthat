import type { Id } from "@/convex/_generated/dataModel";
import type { ComponentType, ReactNode } from "react";

export interface PluginPostTypeSupports {
  title?: boolean;
  editor?: boolean;
  excerpt?: boolean;
  featuredImage?: boolean;
  customFields?: boolean;
  comments?: boolean;
  revisions?: boolean;
  postMeta?: boolean;
  taxonomy?: boolean;
}

export interface PluginPostTypeRewrite {
  hasArchive?: boolean;
  archiveSlug?: string;
  singleSlug?: string;
  withFront?: boolean;
  feeds?: boolean;
  pages?: boolean;
}

export interface PluginPostTypeAdminMenu {
  enabled: boolean;
  label?: string;
  slug?: string;
  menuId?: string;
  icon?: string;
  position?: number;
  parent?: string;
}

export interface PluginPostTypeConfig {
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isBuiltIn?: boolean;
  includeTimestamps?: boolean;
  enableApi?: boolean;
  enableVersioning?: boolean;
  supports?: PluginPostTypeSupports;
  rewrite?: PluginPostTypeRewrite;
  adminMenu: PluginPostTypeAdminMenu;
  singleView?: PluginPostSingleViewConfig;
}

export interface PluginSettingComponentProps {
  pluginId: string;
  pluginName: string;
  settingId: string;
  organizationId?: Id<"organizations">;
}

export interface PluginSettingDefinition {
  id: string;
  slug: string;
  label: string;
  description?: string;
  render: (props: PluginSettingComponentProps) => ReactNode;
}

export interface PluginSingleViewComponentProps {
  pluginId: string;
  pluginName: string;
  postId?: string;
  postTypeSlug: string;
  organizationId?: Id<"organizations">;
}

export interface PluginSingleViewTabDefinition {
  id: string;
  slug: string;
  label: string;
  description?: string;
  usesDefaultEditor?: boolean;
  render?: (props: PluginSingleViewComponentProps) => ReactNode;
}

export interface PluginPostSingleViewConfig {
  basePath?: string;
  defaultTab: string;
  tabs: PluginSingleViewTabDefinition[];
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  features: string[];
  postTypes: PluginPostTypeConfig[];
  settingsPages?: PluginSettingDefinition[];
}
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
  component: ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
  icon?: ComponentType<{ className?: string }>;
}

// Sidebar plugin definition
export interface PluginSidebar {
  position: "top" | "bottom" | "replace";
  component: ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
}

// Slot component definition
export interface PluginSlot {
  component: ComponentType<PluginContext>;
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
