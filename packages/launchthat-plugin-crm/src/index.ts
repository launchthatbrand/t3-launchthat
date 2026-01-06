import type { CrmPluginOptions } from "./plugin";
import { createCrmPluginDefinition, crmPlugin } from "./plugin";

export {
  PLUGIN_ID,
  createCrmPluginDefinition,
  type CrmPluginOptions,
  crmPlugin,
} from "./plugin";

/**
 * Compatibility shim: historically this module mutated an exported `cmsPlugin` variable.
 * No callers exist today, so we keep the API surface but make it explicit.
 */
export const configureCrmPlugin = (options: CrmPluginOptions) => {
  return createCrmPluginDefinition(options);
};

export default crmPlugin;

export { ContactMarketingTagsManager } from "./admin/metaBoxes/ContactMarketingTagsManager";
