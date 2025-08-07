// WordPress-style hook system core implementation
import type { HookCallback, HookRegistration, HookRegistry } from "./types";

// Global hook registry
const hookRegistry: HookRegistry = {
  actions: new Map(),
  filters: new Map(),
};

/**
 * Add a callback function to an action hook (WordPress add_action equivalent)
 */
export function addAction(
  hookName: string,
  callback: HookCallback,
  priority = 10,
  acceptedArgs = 1,
): void {
  const registration: HookRegistration = {
    callback,
    priority,
    acceptedArgs,
  };

  if (!hookRegistry.actions.has(hookName)) {
    hookRegistry.actions.set(hookName, []);
  }

  const hooks = hookRegistry.actions.get(hookName);
  if (!hooks) return;
  hooks.push(registration);

  // Sort by priority (lower numbers execute first)
  hooks.sort((a, b) => a.priority - b.priority);
}

/**
 * Add a callback function to a filter hook (WordPress add_filter equivalent)
 */
export function addFilter(
  hookName: string,
  callback: HookCallback,
  priority = 10,
  acceptedArgs = 1,
): void {
  const registration: HookRegistration = {
    callback,
    priority,
    acceptedArgs,
  };

  if (!hookRegistry.filters.has(hookName)) {
    hookRegistry.filters.set(hookName, []);
  }

  const hooks = hookRegistry.filters.get(hookName);
  if (!hooks) return;
  hooks.push(registration);

  // Sort by priority (lower numbers execute first)
  hooks.sort((a, b) => a.priority - b.priority);
}

/**
 * Execute action hooks (WordPress do_action equivalent)
 */
export function doAction(hookName: string, ...args: unknown[]): void {
  const hooks = hookRegistry.actions.get(hookName);
  if (!hooks) return;

  for (const hook of hooks) {
    try {
      // Limit args to what the callback accepts
      const limitedArgs = args.slice(0, hook.acceptedArgs);
      hook.callback(...limitedArgs);
    } catch (error) {
      console.error(`Error in action hook "${hookName}":`, error);
    }
  }
}

/**
 * Apply filter hooks (WordPress apply_filters equivalent)
 */
export function applyFilters(
  hookName: string,
  value: unknown,
  ...args: unknown[]
): unknown {
  const hooks = hookRegistry.filters.get(hookName);
  if (!hooks) return value;

  let filteredValue = value;

  for (const hook of hooks) {
    try {
      // First arg is always the value being filtered, followed by additional args
      const allArgs = [filteredValue, ...args];
      const limitedArgs = allArgs.slice(0, hook.acceptedArgs);
      const result = hook.callback(...limitedArgs);

      // Update the filtered value for the next filter
      filteredValue = result;
    } catch (error) {
      console.error(`Error in filter hook "${hookName}":`, error);
    }
  }

  return filteredValue;
}

/**
 * Remove an action hook (WordPress remove_action equivalent)
 */
export function removeAction(
  hookName: string,
  callback: HookCallback,
  priority = 10,
): boolean {
  const hooks = hookRegistry.actions.get(hookName);
  if (!hooks) return false;

  const index = hooks.findIndex(
    (hook) => hook.callback === callback && hook.priority === priority,
  );

  if (index === -1) return false;

  hooks.splice(index, 1);
  return true;
}

/**
 * Remove a filter hook (WordPress remove_filter equivalent)
 */
export function removeFilter(
  hookName: string,
  callback: HookCallback,
  priority = 10,
): boolean {
  const hooks = hookRegistry.filters.get(hookName);
  if (!hooks) return false;

  const index = hooks.findIndex(
    (hook) => hook.callback === callback && hook.priority === priority,
  );

  if (index === -1) return false;

  hooks.splice(index, 1);
  return true;
}

/**
 * Check if a hook has any callbacks registered
 */
export function hasAction(hookName: string): boolean {
  const hooks = hookRegistry.actions.get(hookName);
  return Boolean(hooks && hooks.length > 0);
}

/**
 * Check if a filter has any callbacks registered
 */
export function hasFilter(hookName: string): boolean {
  const hooks = hookRegistry.filters.get(hookName);
  return Boolean(hooks && hooks.length > 0);
}

/**
 * Get all registered action hooks (for debugging)
 */
export function getRegisteredActions(): string[] {
  return Array.from(hookRegistry.actions.keys());
}

/**
 * Get all registered filter hooks (for debugging)
 */
export function getRegisteredFilters(): string[] {
  return Array.from(hookRegistry.filters.keys());
}
