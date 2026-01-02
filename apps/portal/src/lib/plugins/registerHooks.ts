import { addAction, addFilter } from "@acme/admin-runtime/hooks";

import type { PluginDefinition } from "./types";

const registeredHookKeys = new Set<string>();
let bootstrapsExecuted = false;

export const bootstrapPluginDefinitions = (definitions: PluginDefinition[]) => {
  if (bootstrapsExecuted) {
    return;
  }

  definitions.forEach((plugin) => {
    plugin.admin?.bootstrap?.();
  });

  bootstrapsExecuted = true;
};

export const registerPluginDefinitionHooks = (
  definitions: PluginDefinition[],
) => {
  const debugPlugins =
    typeof window !== "undefined" && window.location.search.includes("debugPlugins=1");

  if (debugPlugins) {
    // eslint-disable-next-line no-console
    console.log("[plugins][debugPlugins=1] registering hooks for", {
      plugins: definitions.map((p) => p.id),
    });
  }

  definitions.forEach((plugin) => {
    plugin.hooks?.actions?.forEach((entry) => {
      // Support both legacy and current shapes:
      // - { hook, callback, priority, acceptedArgs }
      // - { hookName, handler, priority, acceptedArgs }
      const hook = (entry as any).hook ?? (entry as any).hookName;
      const callback = (entry as any).callback ?? (entry as any).handler;
      const priority = (entry as any).priority;
      const acceptedArgs = (entry as any).acceptedArgs;

      if (typeof hook !== "string" || typeof callback !== "function") return;
      const key = `action:${plugin.id}:${hook}`;
      if (registeredHookKeys.has(key)) return;

      addAction(hook, callback, priority, acceptedArgs);
      registeredHookKeys.add(key);

      if (debugPlugins) {
        // eslint-disable-next-line no-console
        console.log("[plugins][debugPlugins=1] addAction", {
          pluginId: plugin.id,
          hook,
          key,
        });
      }
    });

    plugin.hooks?.filters?.forEach((entry) => {
      const hook = (entry as any).hook ?? (entry as any).hookName;
      const callback = (entry as any).callback ?? (entry as any).handler;
      const priority = (entry as any).priority;
      const acceptedArgs = (entry as any).acceptedArgs;

      if (typeof hook !== "string" || typeof callback !== "function") return;
      const key = `filter:${plugin.id}:${hook}`;
      if (registeredHookKeys.has(key)) return;

      addFilter(hook, callback, priority, acceptedArgs);
      registeredHookKeys.add(key);

      if (debugPlugins) {
        // eslint-disable-next-line no-console
        console.log("[plugins][debugPlugins=1] addFilter", {
          pluginId: plugin.id,
          hook,
          key,
        });
      }
    });
  });
};