import { vimeoPlugin } from "./plugin";

export { configureVimeoPlugin } from "./config";

export {
  PLUGIN_ID,
  type PluginId,
  type CreateVimeoPluginDefinitionOptions,
  createVimeoPluginDefinition,
  vimeoPlugin,
} from "./plugin";

export default vimeoPlugin;

export * from "./admin/VimeoLibrary";
export * from "./admin/VimeoAttachmentsTab";
