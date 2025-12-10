import { pluginDefinitions } from "./definitions";
import {
  bootstrapPluginDefinitions,
  registerPluginDefinitionHooks,
} from "./registerHooks";

bootstrapPluginDefinitions(pluginDefinitions);
registerPluginDefinitionHooks(pluginDefinitions);
