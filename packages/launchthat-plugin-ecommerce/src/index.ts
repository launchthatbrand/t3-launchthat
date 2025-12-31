import { ecommercePlugin } from "./plugin";

export {
  PLUGIN_ID,
  type PluginId,
  createEcommercePluginDefinition,
  type CreateEcommercePluginDefinitionOptions,
  ecommercePlugin,
} from "./plugin";
export { getEcommercePageTemplates } from "./frontend/pageTemplates";
export * from "./payments/registry";
export default ecommercePlugin;
