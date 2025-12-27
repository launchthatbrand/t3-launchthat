import { createLmsPluginDefinition, lmsPlugin } from "./plugin";

export {
  PLUGIN_ID,
  createLmsPluginDefinition,
  lmsPlugin,
} from "./plugin";

export { getDefaultLmsComponents } from "./pluginImpl";

/**
 * Compatibility shim: historically this package mutated an exported `lmsPlugin` variable.
 * No callers exist today, so we keep a helper that returns a new definition.
 */
export const configureLmsPlugin = (
  components: import("./pluginImpl").LmsPluginComponents,
) => {
  return createLmsPluginDefinition(components);
};

// Preserve existing public exports (components, types, etc.)
export * from "./pluginImpl";

export default lmsPlugin;


