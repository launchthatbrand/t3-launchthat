import type { PluginDefinition } from "./types";
import { addAction, addFilter } from "~/lib/hooks/core";

let hooksRegistered = false;

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
