import { disclaimersPlugin } from "./plugin";

export {
  PLUGIN_ID,
  type PluginId,
  type CreateDisclaimersPluginDefinitionOptions,
  createDisclaimersPluginDefinition,
  disclaimersPlugin,
} from "./plugin";

export default disclaimersPlugin;

export * from "./admin/IssuedPage";
export * from "./admin/OverviewPage";
export * from "./admin/SettingsPage";
export * from "./admin/TemplatesPage";
