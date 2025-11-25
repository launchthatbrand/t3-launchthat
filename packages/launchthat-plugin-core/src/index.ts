import type { ComponentType, ReactNode } from "react";

export type Id<TableName extends string = string> = string & {
  __tableName?: TableName;
};

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
  permalink?: PluginPermalinkConfig;
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

export interface PluginFrontendArchiveRendererProps {
  posts: unknown;
  postType: PluginPostTypeConfig;
}

export interface PluginFrontendSingleRendererProps {
  post: unknown;
  postType: PluginPostTypeConfig;
}

export interface PluginPostTypeFrontendConfig {
  archive?: {
    render: (props: PluginFrontendArchiveRendererProps) => ReactNode;
  };
  single?: {
    render: (props: PluginFrontendSingleRendererProps) => ReactNode;
  };
}

export interface PluginPermalinkConfig {
  canonical?: string;
  aliases?: string[];
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
  frontend?: PluginPostTypeFrontendConfig;
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

export interface PluginActivationConfig {
  optionKey: string;
  optionType?: "store" | "site";
  defaultEnabled?: boolean;
}

export interface PluginAdminMenuEntry {
  label: string;
  slug: string;
  icon?: string;
  position?: number;
  group?: string;
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
  activation?: PluginActivationConfig;
  adminMenus?: PluginAdminMenuEntry[];
}

export interface PluginContext {
  postType?: string;
  postId?: string;
  userId?: string;
  isSubmitting?: boolean;
  formData?: unknown;
  [key: string]: unknown;
}

export interface PluginTab {
  id: string;
  label: string;
  component: ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
  icon?: ComponentType<{ className?: string }>;
}

export interface PluginSidebar {
  position: "top" | "bottom" | "replace";
  component: ComponentType<PluginContext>;
  order?: number;
  condition?: (context: PluginContext) => boolean;
}

export interface PluginSlot {
  component: ComponentType<PluginContext>;
  condition?: (context: PluginContext) => boolean;
  order?: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  tabs?: PluginTab[];
  sidebar?: PluginSidebar[];
  slots?: Record<string, PluginSlot[]>;
  onActivate?: (context: PluginContext) => void | Promise<void>;
  onDeactivate?: (context: PluginContext) => void | Promise<void>;
  config?: Record<string, unknown>;
  dependencies?: string[];
  areas?: string[];
}

export interface PluginRegistryEvents {
  "plugin:registered": { plugin: Plugin };
  "plugin:activated": { plugin: Plugin; context: PluginContext };
  "plugin:deactivated": { plugin: Plugin; context: PluginContext };
  "plugin:error": { plugin: Plugin; error: Error; context?: PluginContext };
}

export interface PluginRegistryConfig {
  enabledPlugins?: string[];
  pluginConfigs?: Record<string, unknown>;
}
