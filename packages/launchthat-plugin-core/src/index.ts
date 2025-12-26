import type { ComponentType, ReactNode } from "react";

export type Id<TableName extends string = string> = string & {
  __tableName?: TableName;
};

export interface PluginPostTypeSupports {
  title?: boolean;
  editor?: boolean;
  excerpt?: boolean;
  attachments?: boolean;
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

export type PluginFrontendSingleSlotLocation =
  | "beforeContent"
  | "afterContent"
  | "sidebarTop"
  | "sidebarBottom"
  | "header";

export interface PluginFrontendSingleSlotProps {
  pluginId: string;
  pluginName: string;
  postTypeSlug: string;
  post?: unknown;
  postType?: PluginPostTypeConfig | null;
  organizationId?: Id<"organizations">;
  postMeta?: Record<string, unknown>;
}

export interface PluginFrontendSingleSlotDefinition {
  id: string;
  location: PluginFrontendSingleSlotLocation;
  render: (props: PluginFrontendSingleSlotProps) => ReactNode;
}

export type PluginFrontendFilterLocation =
  | "content"
  | "header"
  | "main"
  | "footer";

export interface PluginFrontendFilterDefinition {
  id: string;
  location: PluginFrontendFilterLocation;
}

export interface PluginPostTypeFrontendConfig {
  archive?: {
    render: (props: PluginFrontendArchiveRendererProps) => ReactNode;
  };
  single?: {
    render: (props: PluginFrontendSingleRendererProps) => ReactNode;
  };
  singleSlots?: PluginFrontendSingleSlotDefinition[];
  providers?: string[];
  filters?: PluginFrontendFilterDefinition[];
}

export interface PluginPermalinkConfig {
  canonical?: string;
  aliases?: string[];
}

export interface PluginPostTypeMetaBox {
  id: string;
  title: string;
  description?: string;
  location?: "main" | "sidebar";
  priority?: number;
  fieldKeys: string[];
  rendererKey?: string;
}

export type PluginMetaBoxFieldValue = string | number | boolean | null;

export interface PluginMetaBoxRendererField {
  key: string;
  name: string;
  description?: string | null;
  type: string;
  required?: boolean;
  options?: unknown;
}

export interface PluginMetaBoxRendererContext {
  pluginId: string;
  pluginName: string;
  postTypeSlug: string;
  organizationId?: string;
  postId?: string;
  isNewRecord: boolean;
  post?: unknown;
  postType?: unknown;
}

export interface PluginMetaBoxRendererProps {
  context: PluginMetaBoxRendererContext;
  metaBox: {
    id: string;
    title: string;
    description?: string | null;
    location: "main" | "sidebar";
  };
  fields: PluginMetaBoxRendererField[];
  getValue: (fieldKey: string) => PluginMetaBoxFieldValue | undefined;
  setValue: (fieldKey: string, value: PluginMetaBoxFieldValue) => void;
  renderField: (
    fieldKey: string,
    options?: {
      idSuffix?: string;
    },
  ) => ReactNode;
  renderFieldControl: (
    fieldKey: string,
    options?: {
      idSuffix?: string;
    },
  ) => ReactNode;
}

export type PluginMetaBoxRenderer = (
  props: PluginMetaBoxRendererProps,
) => ReactNode;

export interface PluginMediaAttachment {
  id: string;
  url: string;
  title?: string;
  alt?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface PluginMediaEmbed {
  url: string;
  html?: string;
  providerName?: string;
  title?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  videoId?: string;
}

export type PluginMediaSelection =
  | { kind: "attachment"; attachment: PluginMediaAttachment }
  | { kind: "embed"; embed: PluginMediaEmbed };

export interface PluginMediaPickerContext {
  onSelectMedia?: (selection: PluginMediaSelection) => void;
}

export type PluginCustomFieldValue = string | number | boolean | null;

export interface PluginPostTypeFieldDefinition {
  key: string;
  name: string;
  description?: string;
  type?: string;
  required?: boolean;
  options?:
    | Array<string | number>
    | Array<{ label: string; value: string | number }>;
  defaultValue?: PluginCustomFieldValue;
  readOnly?: boolean;
}

export interface PluginPostTypeFieldRegistration {
  postTypeSlug: string;
  fields: PluginPostTypeFieldDefinition[];
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
  storageKind?: "posts" | "custom" | "component";
  storageTables?: string[];
  singleView?: PluginPostSingleViewConfig;
  singleViewSlots?: PluginSingleViewSlotDefinition[];
  adminArchiveView?: PluginPostArchiveViewConfig;
  frontend?: PluginPostTypeFrontendConfig;
  metaBoxes?: PluginPostTypeMetaBox[];
  metaBoxRenderers?: Record<string, PluginMetaBoxRenderer>;
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
  parentPostTypeSlug?: string;
}

export interface PluginSingleViewComponentProps {
  pluginId: string;
  pluginName: string;
  postId?: string;
  postTypeSlug: string;
  organizationId?: Id<"organizations">;
  mediaPickerContext?: PluginMediaPickerContext;
}

export type PluginSingleViewSlotLocation =
  | "beforeMainContent"
  | "afterMainContent"
  | "sidebarTop"
  | "sidebarBottom";

export interface PluginSingleViewSlotProps
  extends PluginSingleViewComponentProps {
  post?: unknown;
  postType?: unknown;
  isNewRecord: boolean;
}

export interface PluginSingleViewSlotDefinition {
  id: string;
  location: PluginSingleViewSlotLocation;
  render: (props: PluginSingleViewSlotProps) => ReactNode;
}

export interface PluginSingleViewTabDefinition {
  id: string;
  slug: string;
  label: string;
  description?: string;
  usesDefaultEditor?: boolean;
  render?: (props: PluginSingleViewComponentProps) => ReactNode;
  metaBoxIds?: string[];
  showGeneralPanel?: boolean;
  showCustomFieldsPanel?: boolean;
  mainMetaBoxIds?: string[];
  sidebarMetaBoxIds?: string[];
  useDefaultMainMetaBoxes?: boolean;
  useDefaultSidebarMetaBoxes?: boolean;
}

export interface PluginPostSingleViewConfig {
  basePath?: string;
  defaultTab: string;
  tabs: PluginSingleViewTabDefinition[];
}

export interface PluginArchiveViewTabDefinition {
  id: string;
  slug: string;
  label: string;
  description?: string;
  usesDefaultArchive?: boolean;
  postTypeSlug?: string;
  render?: (props: PluginSingleViewComponentProps) => ReactNode;
}

export interface PluginPostArchiveViewConfig {
  defaultTab?: string;
  tabs?: PluginArchiveViewTabDefinition[];
  showSidebar?: boolean;
}

export interface PluginHookRegistration {
  hook: string;
  callback: (...args: unknown[]) => unknown;
  priority?: number;
  acceptedArgs?: number;
}

export interface PluginHookConfig {
  actions?: PluginHookRegistration[];
  filters?: PluginHookRegistration[];
}

export interface PluginAdminConfig {
  bootstrap?: () => void;
}

export type NotificationEventCategory =
  | "activity"
  | "group"
  | "system"
  | "event"
  | "ecommerce"
  | "lms"
  | "custom";

export interface NotificationEventScopeDefinition {
  /**
   * A plugin-defined scope kind (e.g. "course").
   * `scopeId = null` means "any" within this scope kind (e.g. any course).
   */
  scopeKind: string;
  label: string;
  supportsAny?: boolean;
}

export interface PluginNotificationEventDefinition {
  /**
   * Namespaced event key (e.g. "lms.course.stepAdded").
   * This is what gets stored on notifications as `eventKey` and on subscriptions.
   */
  eventKey: string;
  label: string;
  description?: string;
  category?: NotificationEventCategory;
  scopes?: NotificationEventScopeDefinition[];
  defaultInAppEnabled?: boolean;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  features: string[];
  postTypes: PluginPostTypeConfig[];
  fieldRegistrations?: PluginPostTypeFieldRegistration[];
  settingsPages?: PluginSettingDefinition[];
  notificationEvents?: PluginNotificationEventDefinition[];
  activation?: PluginActivationConfig;
  adminMenus?: PluginAdminMenuEntry[];
  providers?: Record<string, ComponentType<{ children: ReactNode }>>;
  hooks?: PluginHookConfig;
  admin?: PluginAdminConfig;
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
