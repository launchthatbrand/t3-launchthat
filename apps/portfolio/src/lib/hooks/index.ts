// WordPress-style hook system - Main exports

// Core hook functions
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
} from "./core";

// React integration
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
} from "./types";
