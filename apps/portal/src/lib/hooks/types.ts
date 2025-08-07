// WordPress-style hook system types

export type HookCallback = (...args: unknown[]) => unknown;

export interface HookRegistration {
  callback: HookCallback;
  priority: number;
  acceptedArgs: number;
}

export interface HookRegistry {
  actions: Map<string, HookRegistration[]>;
  filters: Map<string, HookRegistration[]>;
}

// Context passed to all hook callbacks
export interface HookContext {
  postType?: string;
  postId?: string;
  userId?: string;
  isSubmitting?: boolean;
  formData?: unknown;
  [key: string]: unknown;
}

// Plugin tab definition (returned by action callbacks)
export interface PluginTab {
  id: string;
  label: string;
  component: React.ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

// Plugin sidebar definition (returned by action callbacks)
export interface PluginSidebar {
  id: string;
  component: React.ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
  position?: "top" | "middle" | "bottom";
}

// Plugin slot content definition (returned by action callbacks)
export interface PluginSlotContent {
  id: string;
  component: React.ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
}
