import type { ComponentType } from "react";

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

// Context passed to hook callbacks. The structure is intentionally loose so the
// host app can augment it with its own fields.
export interface HookContext {
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
  component: ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
  icon?: ComponentType<{ className?: string }>;
}

export interface PluginSidebar {
  position: "top" | "middle" | "bottom";
  component: ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
}

export interface PluginSlotContent {
  id: string;
  component: ComponentType<HookContext>;
  order?: number;
  condition?: (context: HookContext) => boolean;
}

