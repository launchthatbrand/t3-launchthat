import { cmsPlugin, createCmsPluginDefinition, type CmsPluginOptions } from "./plugin";

export { PLUGIN_ID, createCmsPluginDefinition, type CmsPluginOptions, cmsPlugin } from "./plugin";

/**
 * Compatibility shim: historically this module mutated an exported `cmsPlugin` variable.
 * No callers exist today, so we keep the API surface but make it explicit.
 */
export const configureCmsPlugin = (options: CmsPluginOptions) => {
  return createCmsPluginDefinition(options);
};

export default cmsPlugin;


