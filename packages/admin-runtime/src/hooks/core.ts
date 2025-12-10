import type { HookCallback, HookRegistration, HookRegistry } from "./types";

const hookRegistry: HookRegistry = {
  actions: new Map(),
  filters: new Map(),
};

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
  hooks.sort((a, b) => a.priority - b.priority);
}

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
  hooks.sort((a, b) => a.priority - b.priority);
}

export function doAction(hookName: string, ...args: unknown[]): void {
  const hooks = hookRegistry.actions.get(hookName);
  if (!hooks) return;

  for (const hook of hooks) {
    try {
      const limitedArgs = args.slice(0, hook.acceptedArgs);
      hook.callback(...limitedArgs);
    } catch (error) {
      console.error(`Error in action hook "${hookName}":`, error);
    }
  }
}

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
      const allArgs = [filteredValue, ...args];
      const limitedArgs = allArgs.slice(0, hook.acceptedArgs);
      const result = hook.callback(...limitedArgs);
      filteredValue = result;
    } catch (error) {
      console.error(`Error in filter hook "${hookName}":`, error);
    }
  }

  return filteredValue;
}

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

export function hasAction(hookName: string): boolean {
  const hooks = hookRegistry.actions.get(hookName);
  return Boolean(hooks && hooks.length > 0);
}

export function hasFilter(hookName: string): boolean {
  const hooks = hookRegistry.filters.get(hookName);
  return Boolean(hooks && hooks.length > 0);
}

export function getRegisteredActions(): string[] {
  return Array.from(hookRegistry.actions.keys());
}

export function getRegisteredFilters(): string[] {
  return Array.from(hookRegistry.filters.keys());
}

