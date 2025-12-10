import { addAction, addFilter } from "@acme/admin-runtime";

import type { PluginDefinition } from "./types";

let hooksRegistered = false;
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
  if (hooksRegistered) {
    return;
  }

  definitions.forEach((plugin) => {
    plugin.hooks?.actions?.forEach(
      ({ hook, callback, priority, acceptedArgs }) => {
        addAction(hook, callback, priority, acceptedArgs);
      },
    );
    plugin.hooks?.filters?.forEach(
      ({ hook, callback, priority, acceptedArgs }) => {
        addFilter(hook, callback, priority, acceptedArgs);
      },
    );
  });

  hooksRegistered = true;
};
