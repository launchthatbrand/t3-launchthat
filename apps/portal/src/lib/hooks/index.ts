// WordPress-style hook system - Main exports
import "~/lib/plugins/installHooks";

// Core hook functions proxied from the shared runtime
export {
  addAction,
  addFilter,
  doAction,
  applyFilters,
  removeAction,
  removeFilter,
  hasAction,
  hasFilter,
  getRegisteredActions,
  getRegisteredFilters,
} from "@acme/admin-runtime/hooks";

// React integration (portal-specific utilities)
export {
  useApplyFilters,
  useDoAction,
  usePluginTabs,
  usePluginSidebar,
  useSlotContent,
  Slot,
  PluginSidebarContent,
} from "./react";

// Types
export type {
  HookCallback,
  HookRegistration,
  HookRegistry,
  HookContext,
  PluginTab,
  PluginSidebar,
  PluginSlotContent,
} from "@acme/admin-runtime/hooks";
